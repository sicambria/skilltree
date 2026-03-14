document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/graph/data', {
            headers: { 'x-access-token': token }
        });
        const data = await response.json();

        let filteredNodes = [...data.nodes];
        let filteredLinks = [...data.links];

        const svg = d3.select("#graph-container")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");

        const g = svg.append("g");

        const simulation = d3.forceSimulation(filteredNodes)
            .force("link", d3.forceLink(filteredLinks).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(0.1))
            .force("y", d3.forceY(height / 2).strength(0.1));

        let link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(filteredLinks)
            .enter().append("line")
            .attr("class", "link");

        let node = g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(filteredNodes)
            .enter().append("circle")
            .attr("class", d => d.type === 'tree' ? 'node tree-node' : 'node skill-node')
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip);

        let label = g.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(filteredNodes)
            .enter().append("text")
            .attr("class", "node-label")
            .text(d => d.name);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            label
                .attr("x", d => d.x + 8)
                .attr("y", d => d.y + 4);
        });

        // Tooltip logic
        const tooltip = d3.select("#tooltip");

        function showTooltip(event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.name}</strong><br/>Type: ${d.type}<br/>Category: ${d.category}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            
            // Highlight connections
            node.style("opacity", n => (n === d || isConnected(d, n)) ? 1 : 0.1);
            link.style("opacity", l => (l.source === d || l.target === d) ? 1 : 0.1);
        }

        function hideTooltip() {
            tooltip.style("opacity", 0);
            node.style("opacity", 1);
            link.style("opacity", 1);
        }

        const linkedByIndex = {};
        filteredLinks.forEach(d => {
            linkedByIndex[`${d.source.id},${d.target.id}`] = 1;
        });

        function isConnected(a, b) {
            return linkedByIndex[`${a.id},${b.id}`] || linkedByIndex[`${b.id},${a.id}`] || a.id === b.id;
        }

        // Filtering logic
        const searchInput = document.getElementById('node-search');
        const treeToggle = document.getElementById('toggle-trees');
        const skillToggle = document.getElementById('toggle-skills');

        function updateFilters() {
            const searchTerm = searchInput.value.toLowerCase();
            const showTrees = treeToggle.checked;
            const showSkills = skillToggle.checked;

            node.style("display", d => {
                const matchesSearch = d.name.toLowerCase().includes(searchTerm);
                const matchesType = (d.type === 'tree' && showTrees) || (d.type === 'skill' && showSkills);
                return (matchesSearch && matchesType) ? "block" : "none";
            });

            label.style("display", d => {
                const matchesSearch = d.name.toLowerCase().includes(searchTerm);
                const matchesType = (d.type === 'tree' && showTrees) || (d.type === 'skill' && showSkills);
                return (matchesSearch && matchesType) ? "block" : "none";
            });

            link.style("display", d => {
                const sourceVisible = (d.source.type === 'tree' && showTrees) || (d.source.type === 'skill' && showSkills);
                const targetVisible = (d.target.type === 'tree' && showTrees) || (d.target.type === 'skill' && showSkills);
                const sourceMatches = d.source.name.toLowerCase().includes(searchTerm);
                const targetMatches = d.target.name.toLowerCase().includes(searchTerm);
                return (sourceVisible && targetVisible && (sourceMatches || targetMatches)) ? "block" : "none";
            });
        }

        searchInput.addEventListener('input', updateFilters);
        treeToggle.addEventListener('change', updateFilters);
        skillToggle.addEventListener('change', updateFilters);

        // Drag handlers
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

    } catch (err) {
        console.error('Graph Error:', err);
    }
});
