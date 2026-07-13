const MASTERY_NAMES = ["unlit", "glimmer", "shine", "bright", "blazing"];

// Curated grouping for the tag filter bar only -- doesn't touch the data
// model (tags stay flat/multi-valued on each node) or star layout, purely an
// aid for scanning ~20+ tags. Tags not listed here (e.g. from custom stars)
// fall into an "other" group automatically.
const TAG_CATEGORIES = {
  "simulation paradigms": ["eulerian", "lagrangian", "hybrid", "mpm", "sph", "pic", "flip", "particle", "simulation"],
  "numerical methods": ["discretization", "grid", "pde", "navier-stokes", "fem", "position-based"],
  "materials & phenomena": ["fluids", "snow", "sand", "elasticity", "soft-robotics"],
  "learning-based": ["differentiable", "neural", "learning-based", "graph-networks", "dsl", "sparse", "gradient"],
};
const TAG_CATEGORY_ORDER = Object.keys(TAG_CATEGORIES);

// Mastery is purely a brightness dimension now, not a hue -- a star's color
// stays fixed (see starHue below) while its saturation/lightness climb as it
// gets more mastered, the way a dim star looks grayish and a bright one shows
// vivid color to the eye.
const MASTERY_SATURATION = [10, 28, 45, 62, 78];
const MASTERY_LIGHTNESS = [20, 34, 50, 66, 85];

// How far each mastery level's light reaches into the surrounding dark
// background -- a real night sky, not just a bigger dot. Unlit stars cast no
// glow at all; blazing stars visibly illuminate the space around them.
const GLOW_RADIUS = [0, 16, 32, 52, 78];
const GLOW_INNER_OPACITY = [0, 0.5, 0.62, 0.76, 0.92];
const GLOW_MID_OPACITY = [0, 0.18, 0.24, 0.3, 0.38];

// Star size reflects how connected it is (how many constellation lines touch
// it), not mastery -- a well-linked hub reads as a bigger star regardless of
// how mastered it is.
const CORE_RADIUS_MIN = 4.5;
const CORE_RADIUS_SCALE = 3;
const CORE_RADIUS_MAX = 15;

function coreRadius(degree) {
  return Math.min(CORE_RADIUS_MIN + Math.sqrt(degree) * CORE_RADIUS_SCALE, CORE_RADIUS_MAX);
}

// Star color (hue) comes from its most distinctive tag -- the least common
// one it carries, hashed to a hue -- so related stars tend toward similar
// colors without any hand-picked category or region boundary.
function hashTag(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return hash;
}

function tagFrequency(nodes) {
  const freq = {};
  nodes.forEach((n) => n.tags.forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
  return freq;
}

function starHue(node, freq) {
  if (!node.tags.length) return 200;
  const distinctiveTag = node.tags.reduce((best, t) => (freq[t] < freq[best] ? t : best), node.tags[0]);
  return hashTag(distinctiveTag) % 360;
}

function starColor(hue, mastery) {
  return `hsl(${hue}, ${MASTERY_SATURATION[mastery]}%, ${MASTERY_LIGHTNESS[mastery]}%)`;
}

function glowColor(hue) {
  return `hsl(${hue}, 65%, 68%)`;
}

// A pair of stars is drawn as a visible "constellation" link once they share
// at least this many tags; below that, tag overlap still pulls them together
// in the layout but no line is drawn (keeps the map from becoming a hairball).
const VISIBLE_SHARED_TAGS = 2;

// Map labels are shortened so long paper titles don't overlap each other;
// the tooltip and side panel still show the full title. Known seed titles
// get a hand-picked abbreviation (better than any generic heuristic); custom
// stars fall back to their first couple of significant words.
const SHORT_LABELS = {
  "A Material Point Method for Snow Simulation": "MPM Snow",
  "Material Point Method (MPM)": "MPM",
  "The Particle-in-Cell Method for Fluid Dynamics": "PIC",
  "FLIP: A Method for Adaptively Zoned Particle-in-Cell Calculations": "FLIP",
  "PIC/FLIP Transfer Schemes": "PIC/FLIP",
  "Animating Sand as a Fluid": "Animating Sand",
  "Stable Fluids": "Stable Fluids",
  "Navier-Stokes Discretization": "Navier-Stokes",
  "Eulerian vs Lagrangian Methods": "Eulerian/Lagrangian",
  "Smoothed Particle Hydrodynamics: Theory and Application to Non-Spherical Stars": "SPH (orig. 1977)",
  "Smoothed Particle Hydrodynamics (SPH)": "SPH",
  "Position Based Fluids": "Position Based Fluids",
  "Finite Element Method (FEM)": "FEM",
  "Taichi: A Language for High-Performance Computation on Spatially Sparse Data Structures": "Taichi",
  "ChainQueen: A Real-Time Differentiable Physical Simulator for Soft Robotics": "ChainQueen",
  "DiffTaichi: Differentiable Programming for Physical Simulation": "DiffTaichi",
  "Learning to Simulate Complex Physics with Graph Networks": "Learning to Simulate (GNS)",
  "Differentiable Simulation": "Differentiable Sim",
  "Neural / Learning-Based Simulation": "Neural Sim",

  "Fire-Generated Tornadic Vortices": "Fire Tornado Vortices",
  "Dynamics of Swirling Flames": "Swirling Flames",
  "Computer Simulation of Vortex Combustion Processes in Fire-Tube Boilers": "Vortex Combustion",
  "Three Types of Horizontal Vortices Observed in Wildland Mass and Crown Fires": "Horizontal Fire Vortices",
  "Coupling Atmospheric and Fire Models": "Atmosphere-Fire Coupling",
  "Coherent Vortical Structures in Numerical Simulations of Buoyant Plumes from Wildland Fires": "Buoyant Plume Vortices",
  "Review of Vortices in Wildland Fire": "Wildfire Vortices Review",
  "Scintilla: Simulating Combustible Vegetation for Wildfires": "Scintilla",
  "A High-Resolution Large-Eddy Simulation Framework for Wildland Fire Predictions Using TensorFlow": "LES Wildfire",
  "Smoke-Charged Vortices in the Stratosphere Generated by Wildfires and Their Behaviour in Both Hemispheres": "Stratospheric Smoke Vortices",
  "A Simple Model for Wildland Fire Vortex–Sink Interactions": "Vortex-Sink Fire Model",
  "Vorticity-Driven Lateral Spread Ensemble Data Set": "Lateral Spread Dataset",
  "Ignition, Liftoff, and Extinction of Gaseous Diffusion Flames": "Diffusion Flame Ignition",
  "Fire Whirls": "Fire Whirls",
  "FDS Technical Reference Guide": "FDS",
};

const STOP_WORDS = new Set(["a", "an", "the", "of", "for", "on", "in", "to", "with", "and", "vs"]);

function shortLabel(title) {
  if (SHORT_LABELS[title]) return SHORT_LABELS[title];
  const words = title.split(/\s+/).filter((w) => !STOP_WORDS.has(w.toLowerCase()));
  return (words.length ? words : title.split(/\s+/)).slice(0, 2).join(" ");
}

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
  masteryGuideToggle: document.getElementById("mastery-guide-toggle"),
  masteryGuideBody: document.getElementById("mastery-guide-body"),
  masteryGuideHint: document.getElementById("mastery-guide-hint"),
};

el.masteryGuideToggle.addEventListener("click", () => {
  const collapsed = el.masteryGuideBody.classList.toggle("hidden");
  el.masteryGuideHint.textContent = collapsed ? "what do these mean? ↓" : "hide ↑";
});

let svg, container, simulation, nodeSel, linkSel, haloSel;

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
  const seen = new Set();

  TAG_CATEGORY_ORDER.forEach((category) => {
    const tagsInCategory = TAG_CATEGORIES[category].filter((t) => state.tags.includes(t));
    tagsInCategory.forEach((t) => seen.add(t));
    if (tagsInCategory.length) appendTagGroup(category, tagsInCategory);
  });

  const uncategorized = state.tags.filter((t) => !seen.has(t));
  if (uncategorized.length) appendTagGroup("other", uncategorized);
}

function appendTagGroup(label, tags) {
  const group = document.createElement("div");
  group.className = "tag-group";

  const heading = document.createElement("span");
  heading.className = "tag-group-label";
  heading.textContent = label;
  group.appendChild(heading);

  const chips = document.createElement("div");
  chips.className = "tag-group-chips";
  tags.forEach((tag) => {
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
    chips.appendChild(chip);
  });
  group.appendChild(chips);

  el.tagFilter.appendChild(group);
}

function matchesActiveTags(node) {
  if (state.activeTags.size === 0) return true;
  return node.tags.some((t) => state.activeTags.has(t));
}

function applyHighlight() {
  if (!nodeSel) return;
  const dimmed = state.activeTags.size > 0;
  nodeSel.attr("opacity", (d) => (!dimmed || matchesActiveTags(d) ? 1 : 0.15));
  haloSel.attr("opacity", (d) => (!dimmed || matchesActiveTags(d) ? 1 : 0.1));
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

  const defs = svg.append("defs");
  // Softens the gradient's stop edges into a proper bloom rather than a
  // visible ring, and (combined with "screen" blending below) lets several
  // nearby glows melt into one continuously lit patch of sky.
  defs.append("filter").attr("id", "glow-blur").attr("x", "-100%").attr("y", "-100%").attr("width", "300%").attr("height", "300%")
    .append("feGaussianBlur").attr("stdDeviation", 8);

  const nodes = state.nodes.map((n) => ({ ...n }));
  const links = buildLinks(nodes);
  const visibleLinks = links.filter((l) => l.visible);

  // Degree (how many constellation lines touch a star) drives its size;
  // computed here while link.source/target are still plain ids, before
  // d3.forceLink resolves them into node object references below.
  const degreeById = {};
  nodes.forEach((n) => { degreeById[n.id] = 0; });
  visibleLinks.forEach((l) => {
    degreeById[l.source] += 1;
    degreeById[l.target] += 1;
  });
  const freq = tagFrequency(nodes);
  nodes.forEach((n) => {
    n.radius = coreRadius(degreeById[n.id] || 0);
    n.hue = starHue(n, freq);
  });

  // One radial gradient per star (color is per-star via its hue; only
  // opacity/radius scale with mastery).
  nodes.forEach((n) => {
    const gradient = defs.append("radialGradient").attr("id", `star-glow-${n.id}`);
    gradient.append("stop").attr("class", "glow-stop-inner").attr("offset", "0%")
      .attr("stop-color", glowColor(n.hue)).attr("stop-opacity", GLOW_INNER_OPACITY[n.mastery]);
    gradient.append("stop").attr("class", "glow-stop-mid").attr("offset", "45%")
      .attr("stop-color", glowColor(n.hue)).attr("stop-opacity", GLOW_MID_OPACITY[n.mastery]);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", glowColor(n.hue)).attr("stop-opacity", 0);
  });

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => 220 - d.similarity * 160).strength((d) => d.similarity * 0.7))
    .force("charge", d3.forceManyBody().strength(-220))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide((d) => d.radius + 12));

  // All halos live on one shared bottom layer, behind links and star points,
  // with "screen" blending (see CSS) so overlapping glows from nearby lit
  // stars add together into one continuously lit patch of sky instead of
  // stacking as separate visible blobs.
  haloSel = container.append("g")
    .attr("class", "halo-layer")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("class", "star-halo")
    .attr("r", (d) => GLOW_RADIUS[d.mastery])
    .attr("fill", (d) => `url(#star-glow-${d.id})`);

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
    .call(drag(simulation, width, height));

  nodeSel.append("circle")
    .attr("class", "star-core")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => starColor(d.hue, d.mastery));

  nodeSel.append("text")
    .attr("dx", (d) => d.radius + 5)
    .attr("dy", 4)
    .text((d) => shortLabel(d.title));

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
    // Keep every star (including whatever it's being dragged toward) inside
    // the fixed map area -- the map itself never pans/zooms, so this is the
    // only thing keeping stars from drifting off-canvas.
    nodes.forEach((d) => {
      d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
      d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
    });

    linkSel
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    haloSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
}

function drag(sim, width, height) {
  function dragstarted(event) {
    if (!event.active) sim.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    const r = event.subject.radius;
    event.subject.fx = Math.max(r, Math.min(width - r, event.x));
    event.subject.fy = Math.max(r, Math.min(height - r, event.y));
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
  const targetR = datum.radius; // size is fixed by connection count, unaffected by mastery
  const targetColor = starColor(datum.hue, datum.mastery);
  const targetGlowR = GLOW_RADIUS[datum.mastery];

  group.select(".star-core")
    .transition().duration(120).attr("r", targetR * 1.6).attr("fill", targetColor)
    .transition().duration(280).attr("r", targetR);

  const gradient = svg.select(`#star-glow-${nodeId}`);
  gradient.select(".glow-stop-inner")
    .transition().duration(300)
    .attr("stop-opacity", GLOW_INNER_OPACITY[datum.mastery]);
  gradient.select(".glow-stop-mid")
    .transition().duration(300)
    .attr("stop-opacity", GLOW_MID_OPACITY[datum.mastery]);

  haloSel.filter((d) => d.id === nodeId)
    .transition().duration(120).attr("r", targetGlowR * 1.3)
    .transition().duration(400).attr("r", targetGlowR);

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
    el.sidePanel.classList.add("hidden");
    el.sidePanel.innerHTML = "";
    return;
  }

  el.sidePanel.classList.remove("hidden");
  el.sidePanel.innerHTML = "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "side-panel-close";
  closeBtn.textContent = "×";
  closeBtn.title = "close";
  closeBtn.addEventListener("click", () => {
    state.selectedId = null;
    if (nodeSel) nodeSel.classed("selected", false);
    renderSidePanel();
  });
  el.sidePanel.appendChild(closeBtn);

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
