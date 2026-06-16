const User = require('../models/usermodel');
const Tree = require('../models/treemodel');
const ApprovableTree = require('../models/treesforapprovemodel');
const ApprovableSkill = require('../models/skillsforapprovemodel');
const ApprovableTraining = require('../models/trainingsforapprovemodel');
const security = require('../utils/security');

exports.getUserData = async (req, res) => {
    try {
        const userdata = await User.findOne({ username: req.decoded.username });

        if (!userdata) {
            return res.json({ success: false, message: 'User not found.' });
        }

        const user = userdata.toObject();
        delete user.__v;
        delete user._id;
        delete user.hashData;

        if (user.mainTree == undefined) {
            const trees = await Tree.find({});
            user.allTreeNames = trees;
        }

        if (user.admin) {
            user.apprTrees = await ApprovableTree.find({});
            user.apprSkills = await ApprovableSkill.find({});
            user.apprTrainings = await ApprovableTraining.find({});
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchUsersByName = async (req, res) => {
    try {
        const data = req.body;
        const searchValue = (data.value || '').toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const foundUsers = await User.find({
            "username": { $regex: ".*" + searchValue + ".*", '$options': 'i' }
        });
        const resUsers = foundUsers.map(u => ({ name: u.username }));
        res.json(resUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPublicUserData = async (req, res) => {
    try {
        const data = req.body;
        const searchValue = (data.value || '').toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const foundUsers = await User.find({
            "username": { $regex: ".*" + searchValue + ".*", '$options': 'i' }
        }, 'username mainTree willingToTeach teachingDay teachingTime location focusArea skills trees');
        res.json(foundUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.endorse = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: data.username });
        if (!user) {
            return res.json({ success: false, message: 'User not found.' });
        }

        const skill = user.skills.find(obj => obj.name == data.skillName);
        if (!skill.endorsement) skill.endorsement = [];

        if (!skill.endorsement.includes(req.decoded.username)) {
            skill.endorsement.push(req.decoded.username);
            await user.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Already endorsed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) {
            return res.json({ success: false, message: 'User not found.' });
        }

        if (!security.verifyPassword(data.oldPassword, user.hashData)) {
            res.json({ success: false, message: 'wrong password' });
        } else {
            user.hashData = security.hashPassword(data.newPassword);
            await user.save();
            res.json({ success: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        user.location = req.body.location;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateEmail = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        user.email = req.body.email;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateHelp = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        user.willingToTeach = req.body.help;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.handleFirstLogin = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const selectedTree = await Tree.findOne({ name: data.mainTree });
        if (!selectedTree) return res.json({ success: false, message: 'Tree not found.' });

        user.mainTree = data.mainTree;

        const focusAreaTrees = await Tree.find({ focusArea: data.focusArea }, { _id: 0, name: 1 });
        const treeNames = focusAreaTrees.map(t => t.name);

        user.focusArea = {
            name: data.focusArea,
            treeNames: treeNames
        };

        const { sortAndAddTreeToUser } = require('../utils/treeUtils');
        await sortAndAddTreeToUser(selectedTree, user);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
