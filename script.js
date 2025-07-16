const width = 960,
      height = 700;

const svg = d3.select("#network")
  .attr("width", width)
  .attr("height", height);

const color = d3.scaleOrdinal()
  .domain(["core", "ecology", "decolonial", "economic", "critical", "tech", "education"])
  .range(["#000", "#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#03a9f4"]);

const iconMap = {
  "Culture": "img/culture.png",
  "Ecology": "img/ecology.png",
  "Economy": "img/economy.png",
  "Education": "img/education.png",
  "Geography": "img/geography.png",
  "Justice": "img/justice.png",
  "Knowledge": "img/knowledge.png",
  "Politics": "img/politics.png"
};

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(d => d.id).distance(160))
  .force("charge", d3.forceManyBody().strength(-350))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width / 2).strength(0.05))
  .force("y", d3.forceY(height / 2).strength(0.05))
  .force("collide", d3.forceCollide(40));


function getTagColor(tags) {
  if (!tags) return "#999";
  const tagList = tags.split(",").map(t => t.trim().toLowerCase());
  if (tagList.includes("technology")) return "#2196f3";
  if (tagList.includes("justice") || tagList.includes("decolonial") || tagList.includes("indigenous")) return "#4caf50";
  if (tagList.includes("culture") || tagList.includes("media")) return "#f44336";
  if (tagList.includes("education") || tagList.includes("systems")) return "#ff9800";
  return "#999";
}

Promise.all([
  d3.json("nodes_links.json")
]).then(([data]) => {
  const { nodes, links } = data;

  simulation.nodes(nodes);
  simulation.force("link").links(links);

  const link = svg.append("g")
    .attr("stroke", "#aaa")
    .selectAll("line")
    .data(links)
    .join("line");

  const nodeGroup = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation));

  nodeGroup.append("circle")
    .attr("r", 6)
    .attr("fill", d => getTagColor(d.tags))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip.html(`<strong>${d.id}</strong><br>${d.description || "No description available."}`)
              .style("left", `${event.pageX + 15}px`)
              .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(300).style("opacity", 0);
    });

  nodeGroup.append("text")
    .text(d => d.id)
    .attr("font-size", "12px")
    .attr("dx", 12)
    .attr("dy", 4);

  nodeGroup.each(function(d) {
    if (!d.tags) return;
    const tags = d.tags.split(",").map(tag => tag.trim());
    tags.forEach((tag, i) => {
      if (iconMap[tag]) {
        d3.select(this)
          .append("image")
          .attr("xlink:href", iconMap[tag])
          .attr("class", "icon")
          .attr("x", 12 + i * 22)
          .attr("y", -10)
          .attr("width", 18)
          .attr("height", 18);
      }
    });
  });

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodeGroup.attr("transform", d => {
      d.x = Math.max(20, Math.min(width - 20, d.x));
      d.y = Math.max(20, Math.min(height - 20, d.y));
      return `translate(${d.x},${d.y})`;
    });
  });

  const legend = d3.select("body")
    .append("div")
    .attr("class", "legend-container");

  Object.entries(iconMap).forEach(([label, url]) => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("img").attr("src", url);
    item.append("span").text(label);
  });

  [
    { emoji: "🔵", label: "Technology Critique", color: "#2196f3" },
    { emoji: "🟢", label: "Decolonization and Indigenous Practices", color: "#4caf50" },
    { emoji: "🔴", label: "Media Discourse and Cultural Resistance", color: "#f44336" },
    { emoji: "🟠", label: "Education and Institutional Building", color: "#ff9800" }
  ].forEach(({ emoji, label, color }) => {
    const item = legend.append("div").attr("class", "legend-item");
    item.append("span").text(emoji).style("margin-right", "8px");
    item.append("span").text(label);
  });

});

function drag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
}

const validNodeIds = new Set(nodes.map(d => d.id));
const validLinks = links.filter(d => validNodeIds.has(d.source) && validNodeIds.has(d.target));
simulation.force("link").links(validLinks);