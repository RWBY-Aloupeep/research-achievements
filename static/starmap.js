const MASTERY_NAMES = ["unlit", "glimmer", "shine", "bright", "blazing"];
const MASTERY_COLORS = ["#4a5a63", "#9fb4bd", "#39ffc9", "#7fd8ff", "#ffe9a8"];
const MASTERY_RADIUS = [5, 6.5, 8, 9.5, 11];

// A pair of stars is drawn as a visible "constellation" link once they share
// at least this many tags; below that, tag overlap still pulls them together
// in the layout but no line is drawn (keeps the map from becoming a hairball).
const VISIBLE_SHARED_TAGS = 2;

// Below this average tag-similarity, two constellations stop merging into a
// bigger one. Lower = fewer, bigger regions; higher = more, smaller regions.
// 0.15 let one "fluids" mega-region swallow PIC/FLIP+SPH+Eulerian fluids (9 of
// 19 stars) because generic hub tags inflate similarity; 0.25 was the lowest
// value that split PIC/FLIP from SPH cleanly for the seed set. Retune if it
// drifts as more stars get added.
const CLUSTER_MERGE_THRESHOLD = 0.25;

const state = {
  nodes: [],
  tags: [],
  activeTags: new Set(),
  selectedId: null,
  editingId: null,
};

const el = {
  canvas: document.getElementById("starmap-canvas"),
  sidePanel: document.getElementById("side-panel"),
  tagFilter: document.getElementById("tag-filter"),
  skyPercent: document.getElementById("sky-percent"),
  skyProgressFill: document.getElementById("sky-progress-fill"),
  skyMeta: document.getElementById("sky-meta"),
  tooltip: document.getElementById("node-tooltip"),
  openAddForm: document.getElementById("open-add-form"),
  addForm: document.getElementById("add-form"),
  addFormTitle: document.getElementById("add-form-title"),
  cancelAddForm: document.getElementById("cancel-add-form"),
  submitAddForm: document.getElementById("submit-add-form"),
  formTitle: document.getElementById("form-title"),
  formKind: document.getElementById("form-kind"),
  formDescription: document.getElementById("form-description"),
  formTags: document.getElementById("form-tags"),
  formUrl: document.getElementById("form-url"),
};

let svg, container, simulation, nodeSel, linkSel;

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const shared = [...setA].filter((t) => setB.has(t));
  const union = new Set([...setA, ...setB]);
  return { similarity: union.size ? shared.length / union.size : 0, shared: shared.length };
}

// Tags that show up on nearly everything (e.g. "fluids", "particle") shouldn't
// count as much evidence of relatedness as a rare, specific tag (e.g. "sph").
// Used only for clustering into regions -- the raw jaccard() above still
// drives fine-grained layout and which constellation lines get drawn.
function computeIdf(nodes) {
  const freq = {};
  nodes.forEach((n) => n.tags.forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
  const idf = {};
  Object.keys(freq).forEach((t) => { idf[t] = Math.log((nodes.length + 1) / (freq[t] + 0.5)) + 1; });
  return idf;
}

function weightedSimilarity(a, b, idf) {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  let sharedWeight = 0, unionWeight = 0;
  union.forEach((t) => {
    const w = idf[t] ?? 1;
    unionWeight += w;
    if (setA.has(t) && setB.has(t)) sharedWeight += w;
  });
  return unionWeight ? sharedWeight / unionWeight : 0;
}

function buildLinks(nodes) {
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const { similarity, shared } = jaccard(nodes[i].tags, nodes[j].tags);
      if (similarity > 0) {
        links.push({
          source: nodes[i].id,
          target: nodes[j].id,
          similarity,
          visible: shared >= VISIBLE_SHARED_TAGS,
        });
      }
    }
  }
  return links;
}

// Groups stars into "constellations" -- the biggest sub-categories implied by
// the tag data itself, via average-linkage agglomerative clustering on
// IDF-weighted tag similarity. Nothing is hand-assigned: the number and
// membership of clusters falls out of CLUSTER_MERGE_THRESHOLD. Every star
// ends up in exactly one cluster (its primary region), even if that cluster
// is a singleton. Returns clusters sorted biggest-first.
function clusterNodes(nodes, threshold, idf) {
  const n = nodes.length;
  const sim = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const similarity = weightedSimilarity(nodes[i].tags, nodes[j].tags, idf);
      sim[i][j] = similarity;
      sim[j][i] = similarity;
    }
  }

  let clusters = nodes.map((_, i) => [i]);

  function avgSim(a, b) {
    let total = 0;
    for (const i of a) for (const j of b) total += sim[i][j];
    return total / (a.length * b.length);
  }

  while (clusters.length > 1) {
    let bestI = -1, bestJ = -1, bestSim = -Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const s = avgSim(clusters[i], clusters[j]);
        if (s > bestSim) { bestSim = s; bestI = i; bestJ = j; }
      }
    }
    if (bestSim < threshold) break;
    clusters[bestI] = clusters[bestI].concat(clusters[bestJ]);
    clusters.splice(bestJ, 1);
  }

  clusters.sort((a, b) => b.length - a.length);
  return clusters.map((idxs) => idxs.map((i) => nodes[i]));
}

// Labels a region with its most distinguishing tag -- weighted by IDF so a
// tag common across the whole map (e.g. "fluids") doesn't win the label just
// because it appears on most members; a rarer, more specific tag does. A
// stand-in name, not a hand-picked category name.
function labelCluster(members, idf) {
  const freq = {};
  members.forEach((n) => n.tags.forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
  const tags = Object.keys(freq).sort();
  if (tags.length === 0) return "uncategorized";
  const score = (t) => freq[t] * (idf[t] ?? 1);
  return tags.reduce((best, t) => (score(t) > score(best) ? t : best), tags[0]);
}

async function loadAll() {
  const [nodes, tags] = await Promise.all([
    fetchJSON("/api/nodes"),
    fetchJSON("/api/nodes/tags"),
  ]);
  state.nodes = nodes;
  state.tags = tags;
  renderTagFilter();
  renderStats();
  renderStarmap();
  renderSidePanel();
}

function renderStats() {
  const pool = state.activeTags.size
    ? state.nodes.filter((n) => n.tags.some((t) => state.activeTags.has(t)))
    : state.nodes;
  const total = state.nodes.length;
  const litSum = state.nodes.reduce((acc, n) => acc + n.mastery, 0);
  const percent = total ? (litSum / (4 * total)) * 100 : 0;
  el.skyPercent.textContent = `${percent.toFixed(2)}%`;
  el.skyProgressFill.style.width = `${percent}%`;

  if (state.activeTags.size) {
    const tagSum = pool.reduce((acc, n) => acc + n.mastery, 0);
    const tagPercent = pool.length ? (tagSum / (4 * pool.length)) * 100 : 0;
    el.skyMeta.textContent = `${total} stars charted · selected tags: ${pool.length} stars, ${tagPercent.toFixed(2)}% illuminated`;
  } else {
    el.skyMeta.textContent = `${total} stars charted`;
  }
}

function renderTagFilter() {
  el.tagFilter.innerHTML = "";
  state.tags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip" + (state.activeTags.has(tag) ? " active" : "");
    chip.textContent = tag;
    chip.addEventListener("click", () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      renderTagFilter();
      applyHighlight();
      renderStats();
    });
    el.tagFilter.appendChild(chip);
  });
}

function matchesActiveTags(node) {
  if (state.activeTags.size === 0) return true;
  return node.tags.some((t) => state.activeTags.has(t));
}

function applyHighlight() {
  if (!nodeSel) return;
  const dimmed = state.activeTags.size > 0;
  nodeSel.attr("opacity", (d) => (!dimmed || matchesActiveTags(d) ? 1 : 0.15));
  linkSel.attr("stroke-opacity", (d) => {
    const base = 0.35;
    if (!dimmed) return base;
    const bothMatch = matchesActiveTags(d.source) && matchesActiveTags(d.target);
    return bothMatch ? base : 0.04;
  });
}

function renderStarmap() {
  el.canvas.innerHTML = "";
  const width = el.canvas.clientWidth;
  const height = el.canvas.clientHeight;

  svg = d3.select(el.canvas).append("svg").attr("width", width).attr("height", height);
  container = svg.append("g");

  svg.call(
    d3.zoom().scaleExtent([0.3, 3]).on("zoom", (event) => container.attr("transform", event.transform))
  );

  const nodes = state.nodes.map((n) => ({ ...n }));
  // Very weak similarity pairs add noise pulling stars back together across
  // regions without contributing much useful local structure -- drop them
  // from the layout force (clustering above still sees the full picture).
  const links = buildLinks(nodes).filter((l) => l.similarity >= 0.08);
  const visibleLinks = links.filter((l) => l.visible);

  const idf = computeIdf(nodes);
  const clusters = clusterNodes(nodes, CLUSTER_MERGE_THRESHOLD, idf);
  const anchors = clusters.map((members, idx) => {
    const angle = clusters.length > 1 ? (2 * Math.PI * idx) / clusters.length - Math.PI / 2 : 0;
    const radius = clusters.length > 1 ? Math.min(width, height) * 0.42 : 0;
    const anchor = {
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
      label: labelCluster(members, idf),
      size: members.length,
    };
    members.forEach((m) => { m.clusterIndex = idx; });
    return anchor;
  });

  const regionLayer = container.append("g").attr("class", "region-layer");
  if (anchors.length > 1) {
    anchors.forEach((a) => {
      const boundaryR = 44 + a.size * 15;
      // Push the label outward along the center->anchor direction, so labels
      // fan out around the circle instead of all bunching toward the top.
      const dx = a.x - width / 2, dy = a.y - height / 2;
      const len = Math.hypot(dx, dy) || 1;
      const labelX = a.x + (dx / len) * (boundaryR + 14);
      const labelY = a.y + (dy / len) * (boundaryR + 14);

      regionLayer.append("circle")
        .attr("class", "region-boundary")
        .attr("cx", a.x).attr("cy", a.y)
        .attr("r", boundaryR);
      regionLayer.append("text")
        .attr("class", "region-label")
        .attr("x", labelX).attr("y", labelY)
        .text(a.label);
    });
  }

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => 130 - d.similarity * 80).strength((d) => d.similarity * 0.5))
    .force("charge", d3.forceManyBody().strength(-160))
    .force("clusterX", d3.forceX((d) => anchors[d.clusterIndex].x).strength(0.32))
    .force("clusterY", d3.forceY((d) => anchors[d.clusterIndex].y).strength(0.32))
    .force("collide", d3.forceCollide(24));

  linkSel = container.append("g")
    .selectAll("line")
    .data(visibleLinks)
    .join("line")
    .attr("class", "star-link")
    .attr("stroke-opacity", 0.35);

  nodeSel = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", (d) => `star-node ${d.id === state.selectedId ? "selected" : ""}`)
    .call(drag(simulation));

  nodeSel.append("circle")
    .attr("class", "star-halo")
    .attr("r", (d) => MASTERY_RADIUS[d.mastery] + 6)
    .attr("fill", (d) => MASTERY_COLORS[d.mastery])
    .attr("opacity", (d) => (d.mastery >= 3 ? 0.35 : 0))
    .style("filter", "blur(4px)");

  nodeSel.append("circle")
    .attr("class", "star-core")
    .attr("r", (d) => MASTERY_RADIUS[d.mastery])
    .attr("fill", (d) => MASTERY_COLORS[d.mastery]);

  nodeSel.append("text")
    .attr("dx", (d) => MASTERY_RADIUS[d.mastery] + 5)
    .attr("dy", 4)
    .text((d) => d.title);

  nodeSel.on("click", (event, d) => {
    state.selectedId = d.id;
    nodeSel.classed("selected", (n) => n.id === state.selectedId);
    renderSidePanel();
  });

  nodeSel.on("mousemove", (event, d) => {
    el.tooltip.style.display = "block";
    el.tooltip.style.left = `${event.clientX + 14}px`;
    el.tooltip.style.top = `${event.clientY + 14}px`;
    el.tooltip.textContent = `${d.title} · ${MASTERY_NAMES[d.mastery]}`;
  }).on("mouseleave", () => {
    el.tooltip.style.display = "none";
  });

  applyHighlight();

  simulation.on("tick", () => {
    linkSel
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
}

function drag(sim) {
  function dragstarted(event) {
    if (!event.active) sim.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) sim.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

function lightUpAnimation(nodeId) {
  if (!nodeSel) return;
  const group = nodeSel.filter((d) => d.id === nodeId);
  const datum = group.datum();
  const targetR = MASTERY_RADIUS[datum.mastery];
  const targetColor = MASTERY_COLORS[datum.mastery];

  group.select(".star-core")
    .transition().duration(120).attr("r", targetR * 2).attr("fill", targetColor)
    .transition().duration(280).attr("r", targetR);

  group.select(".star-halo")
    .transition().duration(120)
    .attr("r", MASTERY_RADIUS[datum.mastery] + 6)
    .attr("fill", targetColor)
    .attr("opacity", datum.mastery >= 3 ? 0.35 : 0);

  const ring = group.append("circle")
    .attr("class", "star-node-ripple")
    .attr("r", targetR)
    .attr("fill", "none")
    .attr("stroke", targetColor)
    .attr("stroke-width", 2)
    .attr("opacity", 0.9);

  ring.transition().duration(600)
    .attr("r", targetR + 26)
    .attr("opacity", 0)
    .remove();
}

function renderSidePanel() {
  const node = state.nodes.find((n) => n.id === state.selectedId);
  if (!node) {
    el.sidePanel.innerHTML = `<div class="side-panel-empty">click a star to inspect it</div>`;
    return;
  }

  el.sidePanel.innerHTML = "";

  const kind = document.createElement("div");
  kind.className = "side-panel-kind";
  kind.textContent = node.kind;
  el.sidePanel.appendChild(kind);

  const title = document.createElement("h3");
  title.className = "side-panel-title";
  title.textContent = node.title;
  el.sidePanel.appendChild(title);

  if (node.description) {
    const desc = document.createElement("p");
    desc.className = "side-panel-desc";
    desc.textContent = node.description;
    el.sidePanel.appendChild(desc);
  }

  const tags = document.createElement("div");
  tags.className = "side-panel-tags";
  node.tags.forEach((t) => {
    const tagEl = document.createElement("span");
    tagEl.className = "card-tag";
    tagEl.textContent = t;
    tags.appendChild(tagEl);
  });
  el.sidePanel.appendChild(tags);

  if (node.url) {
    const link = document.createElement("a");
    link.className = "side-panel-url";
    link.href = node.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = node.url;
    el.sidePanel.appendChild(link);
  }

  const masteryControl = document.createElement("div");
  masteryControl.className = "mastery-control";

  const label = document.createElement("div");
  label.className = "mastery-control-label";
  label.textContent = "mastery";
  masteryControl.appendChild(label);

  const dots = document.createElement("div");
  dots.className = "mastery-dots";
  for (let level = 0; level <= 4; level++) {
    const dot = document.createElement("button");
    dot.className = "mastery-dot" + (level > 0 && level <= node.mastery ? ` filled m${level}` : "");
    dot.title = `${level} — ${MASTERY_NAMES[level]}`;
    dot.addEventListener("click", () => onSetMastery(node.id, level));
    dots.appendChild(dot);
  }
  masteryControl.appendChild(dots);

  const name = document.createElement("div");
  name.className = "mastery-name";
  name.textContent = `${node.mastery} — ${MASTERY_NAMES[node.mastery]}`;
  masteryControl.appendChild(name);

  el.sidePanel.appendChild(masteryControl);

  const actions = document.createElement("div");
  actions.className = "side-panel-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "btn";
  editBtn.textContent = "edit";
  editBtn.addEventListener("click", () => onEditNode(node));
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-cancel";
  deleteBtn.textContent = "delete";
  deleteBtn.addEventListener("click", () => onDeleteNode(node.id));
  actions.appendChild(deleteBtn);

  el.sidePanel.appendChild(actions);
}

async function onSetMastery(nodeId, level) {
  try {
    const updated = await fetchJSON(`/api/nodes/${nodeId}/mastery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mastery: level }),
    });
    const idx = state.nodes.findIndex((n) => n.id === nodeId);
    state.nodes[idx] = updated;
    const simDatum = nodeSel.data().find((d) => d.id === nodeId);
    if (simDatum) simDatum.mastery = updated.mastery;
    lightUpAnimation(nodeId);
    renderSidePanel();
    renderStats();
  } catch (err) {
    alert(err.message);
  }
}

async function onDeleteNode(nodeId) {
  if (!confirm("Delete this star? This cannot be undone.")) return;
  try {
    await fetchJSON(`/api/nodes/${nodeId}`, { method: "DELETE" });
    state.selectedId = null;
    const tags = await fetchJSON("/api/nodes/tags");
    state.tags = tags;
    state.nodes = await fetchJSON("/api/nodes");
    renderTagFilter();
    renderStarmap();
    renderSidePanel();
    renderStats();
  } catch (err) {
    alert(err.message);
  }
}

function onEditNode(node) {
  state.editingId = node.id;
  el.addFormTitle.textContent = `edit star: ${node.title}`;
  el.formTitle.value = node.title;
  el.formKind.value = node.kind;
  el.formDescription.value = node.description || "";
  el.formTags.value = node.tags.join(", ");
  el.formUrl.value = node.url || "";
  el.addForm.classList.remove("hidden");
  el.addForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function resetForm() {
  state.editingId = null;
  el.addFormTitle.textContent = "chart new star";
  el.addForm.classList.add("hidden");
  el.formTitle.value = "";
  el.formKind.value = "paper";
  el.formDescription.value = "";
  el.formTags.value = "";
  el.formUrl.value = "";
}

el.openAddForm.addEventListener("click", () => {
  state.editingId = null;
  el.addFormTitle.textContent = "chart new star";
  el.addForm.classList.remove("hidden");
});
el.cancelAddForm.addEventListener("click", resetForm);

el.submitAddForm.addEventListener("click", async () => {
  const title = el.formTitle.value.trim();
  const kind = el.formKind.value;
  const description = el.formDescription.value.trim();
  const tags = el.formTags.value.split(",").map((t) => t.trim()).filter(Boolean);
  const url = el.formUrl.value.trim() || null;

  if (!title) {
    alert("title is required");
    return;
  }

  try {
    if (state.editingId) {
      await fetchJSON(`/api/nodes/${state.editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, kind, description, tags, url }),
      });
    } else {
      await fetchJSON("/api/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, kind, description, tags, url }),
      });
    }
    resetForm();
    const tagsList = await fetchJSON("/api/nodes/tags");
    state.tags = tagsList;
    state.nodes = await fetchJSON("/api/nodes");
    renderTagFilter();
    renderStarmap();
    renderStats();
  } catch (err) {
    alert(err.message);
  }
});

loadAll().catch((err) => {
  console.error(err);
  el.canvas.innerHTML = `<div class="empty-state">failed to load star map: ${err.message}</div>`;
});
