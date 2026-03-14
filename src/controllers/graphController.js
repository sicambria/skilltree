const Skill = require('../models/skillmodel');
const Tree = require('../models/treemodel');

exports.getGraphData = async (req, res) => {
    try {
        const skills = await Skill.find({}, 'name categoryName parents children');
        const trees = await Tree.find({}, 'name skillNames focusArea');

        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        // 1. Add Tree Nodes
        trees.forEach(tree => {
            const nodeId = `tree-${tree.name}`;
            if (!nodeMap.has(nodeId)) {
                nodes.push({
                    id: nodeId,
                    name: tree.name,
                    type: 'tree',
                    category: tree.focusArea || 'General',
                    val: 15 // Larger size for trees
                });
                nodeMap.set(nodeId, true);
            }

            // 2. Add Links from Tree to its top-level Skills
            // In our system, trees just list skill names. 
            // We'll treat all skills in a tree as children of the tree node for visualization.
            tree.skillNames.forEach(skillName => {
                links.push({
                    source: nodeId,
                    target: `skill-${skillName}`,
                    type: 'tree-membership'
                });
            });
        });

        // 3. Add Skill Nodes
        skills.forEach(skill => {
            const nodeId = `skill-${skill.name}`;
            if (!nodeMap.has(nodeId)) {
                nodes.push({
                    id: nodeId,
                    name: skill.name,
                    type: 'skill',
                    category: skill.categoryName || 'General',
                    val: 5 // Smaller size for skills
                });
                nodeMap.set(nodeId, true);
            }

            // 4. Add Links for Skill Parents/Children
            skill.parents.forEach(parentName => {
                links.push({
                    source: `skill-${parentName}`,
                    target: nodeId,
                    type: 'parent-child'
                });
            });
        });

        res.json({ nodes, links });
    } catch (err) {
        console.error('❌ Graph Data Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch graph data' });
    }
};
