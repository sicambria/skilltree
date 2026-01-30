const User = require('../models/usermodel');
const Tree = require('../models/treemodel');
const ApprovableTree = require('../models/treesforapprovemodel');
const treeUtils = require('../utils/treeUtils');

exports.searchTreesByName = async (req, res) => {
    try {
        const data = req.body;
        const foundTrees = await Tree.find({
            "name": { $regex: ".*" + data.value + ".*", '$options': 'i' }
        });
        res.json(foundTrees.map(t => ({ name: t.name })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPublicTreeData = async (req, res) => {
    try {
        const data = req.body;
        const foundTrees = await Tree.find({
            "name": { $regex: ".*" + data.value + ".*", '$options': 'i' }
        });
        res.json(foundTrees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.addTreeToUser = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        const tree = await Tree.findOne({ "name": data.value });

        if (tree) {
            if (!user.trees.find(obj => obj.name == tree.name)) {
                await treeUtils.sortAndAddTreeToUser(tree, user);
                res.json({ success: true, name: tree.name });
            } else {
                res.json({ message: "existing", success: false });
            }
        } else {
            res.json({ message: "notfound", success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.newTree = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        if (!user.trees.find(obj => obj.name == data.name)) {
            const sn = await treeUtils.sortTree(data.skills);
            user.trees.push({
                name: data.name,
                focusArea: data.focusArea,
                description: data.description,
                skillNames: sn
            });

            data.skills.forEach(skill => {
                skill.achievedPoint = 0;
                if (!user.skills.find(obj => obj.name == skill.name)) {
                    user.skills.push(skill);
                }
            });

            await user.save();

            const tree = new ApprovableTree({
                name: data.name,
                username: user.username,
                focusArea: data.focusArea,
                description: data.description,
                skillNames: sn
            });
            await tree.save();

            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'treeexists' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.editMyTree = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const treeIndex = user.trees.findIndex(obj => obj.name == data.name);
        if (treeIndex !== -1) {
            const sn = await treeUtils.sortTree(data.skills);
            user.trees[treeIndex] = {
                name: data.name,
                focusArea: data.focusArea,
                description: data.description,
                skillNames: sn
            };

            data.skills.forEach(skill => {
                if (skill.achievedPoint == undefined) skill.achievedPoint = 0;
                if (!user.skills.find(obj => obj.name == skill.name)) {
                    user.skills.push(skill);
                }
            });

            await user.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'tree not exists' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteMyTree = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        if (user.trees.find(obj => obj.name == data.name)) {
            user.trees = user.trees.filter(obj => obj.name != data.name);
            await user.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'tree not exists' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTreeDetails = async (req, res) => {
    try {
        const tree = await Tree.findOne({ name: req.body.name });
        res.json(tree);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
