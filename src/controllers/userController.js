const User = require('../models/usermodel');
const Tree = require('../models/treemodel');
const SkillDomain = require('../models/skilldomainmodel');
const ApprovableTree = require('../models/treesforapprovemodel');
const ApprovableSkill = require('../models/skillsforapprovemodel');
const ApprovableTraining = require('../models/trainingsforapprovemodel');
const Goal = require('../models/goalmodel');
const LearningPlan = require('../models/learningplanmodel');
const FeedPost = require('../models/feedpostmodel');
const Skill = require('../models/skillmodel');
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

exports.handleDepthOnboarding = async (req, res) => {
    try {
        const { domainPath } = req.body;
        if (!domainPath || !Array.isArray(domainPath) || domainPath.length === 0) {
            return res.json({ success: false, message: 'domainPath array required.' });
        }

        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const leafDomain = await SkillDomain.findOne({ name: domainPath[domainPath.length - 1] });
        if (!leafDomain) return res.json({ success: false, message: 'Leaf domain not found.' });

        user.domainPath = domainPath;

        const allDomains = await SkillDomain.find({ name: { $in: domainPath } });
        const allNames = [];
        for (const d of allDomains) {
            d.skillNames.forEach(sn => { if (!allNames.includes(sn)) allNames.push(sn); });
        }

        const globalSkills = await Skill.find({ name: { $in: allNames } });
        for (const gs of globalSkills) {
            if (!user.skills.find(s => s.name === gs.name)) {
                const skillObj = gs.toObject();
                delete skillObj._id;
                delete skillObj.__v;
                user.skills.push({ ...skillObj, achievedPoint: 0 });
            }
        }

        const matchingTree = await Tree.findOne({ name: domainPath[domainPath.length - 1] })
            || await Tree.findOne({ name: { $regex: leafDomain.name, $options: 'i' } });
        if (matchingTree) {
            user.mainTree = matchingTree.name;
            const { sortAndAddTreeToUser } = require('../utils/treeUtils');
            user.trees.push({
                name: matchingTree.name,
                focusArea: matchingTree.focusArea,
                description: matchingTree.description,
                skillNames: matchingTree.skillNames
            });
        }

        user.focusArea = {
            name: leafDomain.name,
            treeNames: matchingTree ? [matchingTree.name] : []
        };

        await user.save();
        res.json({ success: true, domainPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillDomains = async (req, res) => {
    try {
        const { parent } = req.query;
        const filter = parent !== undefined ? { parent: parent || null } : {};
        const domains = await SkillDomain.find(filter).sort({ depth: 1, name: 1 });
        const data = domains.map(d => ({
            name: d.name,
            depth: d.depth,
            parent: d.parent,
            description: d.description,
            icon: d.icon,
            skillCount: d.skillNames.length
        }));
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.exportProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const userData = user.toObject();
        delete userData._id;
        delete userData.__v;
        delete userData.hashData;

        const goals = (await Goal.find({ $or: [{ username: user.username }, { collaborators: user.username }] })).map(g => { const o = g.toObject(); delete o.__v; return o; });
        const plans = (await LearningPlan.find({ $or: [{ username: user.username }, { participants: user.username }] })).map(p => { const o = p.toObject(); delete o.__v; return o; });
        const feedPosts = (await FeedPost.find({ username: user.username })).map(f => { const o = f.toObject(); delete o.__v; return o; });

        res.json({
            success: true,
            profile: {
                exportedAt: new Date().toISOString(),
                version: '1.0.0',
                user: userData,
                goals,
                learningPlans: plans,
                feedPosts
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.importProfile = async (req, res) => {
    try {
        const { profile, mode } = req.body;
        if (!profile || !profile.user) {
            return res.json({ success: false, message: 'Invalid profile data.' });
        }

        const importMode = mode === 'overwrite' ? 'overwrite' : mode === 'merge' ? 'merge' : 'skip';
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const stats = { skills: { imported: 0, skipped: 0 }, trees: { imported: 0, skipped: 0 }, categories_skipped: 0, goals: 0, plans: 0 };

        const incomingUser = profile.user;

        if (incomingUser.focusArea) {
            user.focusArea = incomingUser.focusArea;
        }
        if (incomingUser.domainPath) {
            user.domainPath = incomingUser.domainPath;
        }
        if (incomingUser.location) {
            user.location = incomingUser.location;
        }
        if (incomingUser.willingToTeach !== undefined) {
            user.willingToTeach = incomingUser.willingToTeach;
        }
        if (incomingUser.teachingDay) user.teachingDay = incomingUser.teachingDay;
        if (incomingUser.teachingTime) user.teachingTime = incomingUser.teachingTime;

        if (incomingUser.categories) {
            if (importMode === 'overwrite') {
                user.categories = incomingUser.categories;
            } else {
                for (const inc of incomingUser.categories) {
                    const existing = user.categories.find(c => c.name === inc.name);
                    if (!existing) user.categories.push(inc);
                    else stats.categories_skipped++;
                }
            }
        }

        if (incomingUser.skills) {
            if (importMode === 'overwrite') {
                user.skills = incomingUser.skills.map(s => ({ ...s, achievedPoint: s.achievedPoint || 0 }));
                stats.skills.imported = incomingUser.skills.length;
            } else if (importMode === 'merge') {
                for (const inc of incomingUser.skills) {
                    const existing = user.skills.find(s => s.name === inc.name);
                    if (!existing) {
                        user.skills.push({ ...inc, achievedPoint: inc.achievedPoint || 0 });
                        stats.skills.imported++;
                    } else {
                        stats.skills.skipped++;
                    }
                }
            }
        }

        if (incomingUser.trees) {
            if (importMode === 'overwrite') {
                user.trees = incomingUser.trees;
                stats.trees.imported = incomingUser.trees.length;
            } else {
                for (const inc of incomingUser.trees) {
                    const existing = user.trees.find(t => t.name === inc.name);
                    if (!existing) {
                        user.trees.push(inc);
                        stats.trees.imported++;
                    } else {
                        stats.trees.skipped++;
                    }
                }
            }
        }

        if (incomingUser.mainTree) user.mainTree = incomingUser.mainTree;
        if (incomingUser.email && incomingUser.email !== user.email) {
            const emailOwner = await User.findOne({ email: incomingUser.email });
            if (emailOwner && emailOwner.username !== user.username) {
                return res.json({ success: false, message: 'Email already in use by another user.' });
            }
            user.email = incomingUser.email;
        }

        await user.save();

        if (profile.goals && Array.isArray(profile.goals)) {
            for (const g of profile.goals) {
                const existing = await Goal.findOne({ username: user.username, title: g.title, skillName: g.skillName });
                if (!existing) {
                    await new Goal({
                        username: user.username,
                        title: g.title,
                        skillName: g.skillName,
                        targetLevel: g.targetLevel,
                        targetDate: g.targetDate,
                    }).save();
                    stats.goals++;
                }
            }
        }

        if (profile.learningPlans && Array.isArray(profile.learningPlans)) {
            for (const p of profile.learningPlans) {
                const existing = await LearningPlan.findOne({ username: user.username, title: p.title });
                if (!existing) {
                    await new LearningPlan({
                        username: user.username,
                        title: p.title,
                        description: p.description,
                        type: p.type || 'personal',
                        participants: [user.username],
                        horizons: p.horizons || { shortTerm: {}, midTerm: {}, longTerm: {} }
                    }).save();
                    stats.plans++;
                }
            }
        }

        res.json({ success: true, message: 'Profile imported successfully.', stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
