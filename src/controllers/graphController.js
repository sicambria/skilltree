const Skill = require('../models/skillmodel');
const Tree = require('../models/treemodel');

exports.getGraphData = async (req, res) => {
    try {
        const skills = await Skill.find({}, 'name categoryName parents children relationships');
        const trees = await Tree.find({}, 'name skillNames focusArea');

        const nodes = [];
        const links = [];
        const nodeMap = new Map();

        trees.forEach(tree => {
            const nodeId = `tree-${tree.name}`;
            if (!nodeMap.has(nodeId)) {
                nodes.push({
                    id: nodeId,
                    name: tree.name,
                    type: 'tree',
                    category: tree.focusArea || 'General',
                    val: 15
                });
                nodeMap.set(nodeId, true);
            }

            tree.skillNames.forEach(skillName => {
                links.push({
                    source: nodeId,
                    target: `skill-${skillName}`,
                    type: 'tree-membership'
                });
            });
        });

        skills.forEach(skill => {
            const nodeId = `skill-${skill.name}`;
            if (!nodeMap.has(nodeId)) {
                nodes.push({
                    id: nodeId,
                    name: skill.name,
                    type: 'skill',
                    category: skill.categoryName || 'General',
                    val: 5
                });
                nodeMap.set(nodeId, true);
            }

            skill.parents.forEach(parentName => {
                links.push({
                    source: `skill-${parentName}`,
                    target: nodeId,
                    type: 'parent-child'
                });
            });

            (skill.relationships || []).forEach(rel => {
                links.push({
                    source: nodeId,
                    target: `skill-${rel.skillName}`,
                    type: rel.type
                });
            });
        });

        res.json({ nodes, links });
    } catch (err) {
        console.error('Graph Data Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch graph data' });
    }
};
