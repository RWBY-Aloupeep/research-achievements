const canvas = document.getElementById("graph-canvas");
const tooltip = document.getElementById("node-tooltip");

async function loadGraph() {
  const res = await fetch("/api/graph");
  const { nodes, edges } = await res.json();

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const svg = d3.select(canvas)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const container = svg.append("g");

  svg.call(
    d3.zoom()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => container.attr("transform", event.transform))
  );

  const links = edges.map((e) => ({ ...e }));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance(110).strength(0.6))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(36));

  const link = container.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("class", "graph-link");

  const linkLabel = container.append("g")
    .selectAll("text")
    .data(links)
    .join("text")
    .attr("class", "graph-link-label")
    .text((d) => d.relation_type);

  const node = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", (d) => `graph-node ${d.type}${d.type === "achievement" && !d.unlocked ? " locked" : ""}`)
    .call(drag(simulation));

  node.append("circle").attr("r", 9);

  node.append("text")
    .attr("dx", 13)
    .attr("dy", 4)
    .text((d) => d.label);

  node.on("mousemove", (event, d) => {
    tooltip.style.display = "block";
    tooltip.style.left = `${event.clientX + 14}px`;
    tooltip.style.top = `${event.clientY + 14}px`;
    tooltip.textContent = tooltipText(d);
  }).on("mouseleave", () => {
    tooltip.style.display = "none";
  });

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    linkLabel
      .attr("x", (d) => (d.source.x + d.target.x) / 2)
      .attr("y", (d) => (d.source.y + d.target.y) / 2);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
}

function tooltipText(d) {
  if (d.type === "achievement") {
    return `${d.label}\ntier: ${d.tier} · ${d.unlocked ? "unlocked" : "locked"}`;
  }
  if (d.type === "paper") {
    return `${d.label}\nstatus: ${d.status}`;
  }
  return d.label;
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }
  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }
  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

loadGraph().catch((err) => {
  console.error(err);
  canvas.innerHTML = `<div class="empty-state">failed to load graph: ${err.message}</div>`;
});
