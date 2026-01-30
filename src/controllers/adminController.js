const User = require('../models/usermodel');
const Skill = require('../models/skillmodel');
const Tree = require('../models/treemodel');
const ApprovableTree = require('../models/treesforapprovemodel');
const ApprovableSkill = require('../models/skillsforapprovemodel');
const ApprovableTraining = require('../models/trainingsforapprovemodel');
const treeUtils = require('../utils/treeUtils');
const skillUtils = require('../utils/skillUtils');

exports.approveSkill = async (req, res) => {
    try {
        const skillforapproval = req.body;
        const approvecollection = await ApprovableSkill.find({});

        const globalskill = await skillUtils.findSkillByName(skillforapproval.name);

        if (globalskill !== null) {
            return res.json({ success: false, message: "Skill already exists" });
        }

        const newGlobalSkill = new Skill({
            name: skillforapproval.name,
            categoryName: skillforapproval.categoryName,
            skillIcon: skillforapproval.skillIcon,
            description: skillforapproval.description,
            descriptionWikipediaURL: skillforapproval.descriptionWikipediaURL,
            pointDescription: skillforapproval.pointDescription,
            maxPoint: skillforapproval.maxPoint,
            parents: skillforapproval.parent,
            children: [{
                name: skillforapproval.name,
                minPoint: skillforapproval.minPoint,
                recommended: skillforapproval.recommended
            }],
            trainings: [{
                name: skillforapproval.training.name,
                level: skillforapproval.training.level,
                shortDescription: skillforapproval.training.shortDescription,
                URL: skillforapproval.training.URL,
                goal: skillforapproval.training.goal,
                length: skillforapproval.traininglength,
                language: skillforapproval.training.language
            }]
        });
        await newGlobalSkill.save();

        const dependency = [];
        await treeUtils.getDependency(approvecollection, skillforapproval, dependency);

        const lastdependency = dependency[dependency.length - 1];

        for (let i = 0; i < dependency.length; i++) {
            const gs = await skillUtils.findSkillByName(dependency[i].name);
            if (gs === null) {
                const depSkill = new Skill({
                    name: dependency[i].name,
                    categoryName: dependency[i].categoryName,
                    skillIcon: dependency[i].skillIcon,
                    description: dependency[i].description,
                    pointDescription: dependency[i].pointDescription,
                    maxPoint: dependency[i].maxPoint,
                    parents: dependency[i].parent,
                    children: [{
                        name: dependency[i].name,
                        minPoint: dependency[i].minPoint,
                        recommended: dependency[i].recommended
                    }],
                    trainings: [{
                        name: dependency[i].training.name,
                        level: dependency[i].training.level,
                        shortDescription: dependency[i].training.shortDescription,
                        URL: dependency[i].training.URL,
                        goal: dependency[i].training.goal,
                        length: dependency[i].traininglength,
                        language: dependency[i].training.language
                    }]
                });
                await depSkill.save();
            }
        }

        if (lastdependency && lastdependency.parents) {
            for (let i = 0; i < lastdependency.parents.length; i++) {
                const lastdependencyParent = await Skill.findOne({ name: lastdependency.parents[i] });
                if (lastdependencyParent) {
                    lastdependencyParent.children.push({
                        name: lastdependency.name,
                        minPoint: 0,
                        recommended: false
                    });
                    await lastdependencyParent.save();
                }
            }
        }

        res.json({ message: "Succes", success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.editTree = async (req, res) => {
    try {
        const data = req.body;
        const globalTree = await Tree.findOne({ name: data.name });
        if (!globalTree) return res.json({ success: false, message: 'Tree not found' });

        const sn = await treeUtils.sortTree(data.skills);
        globalTree.focusArea = data.focusArea;
        globalTree.description = data.description;
        globalTree.skillNames = sn;
        await globalTree.save();

        const users = await User.find({ "trees.name": data.name });
        for (const user of users) {
            const userTree = user.trees.find(obj => obj.name == data.name);
            userTree.focusArea = data.focusArea;
            userTree.description = data.description;
            userTree.skillNames = sn;
            await user.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.editSkill = async (req, res) => {
    try {
        const data = req.body;
        const skill = await skillUtils.findSkillByName(data.name);
        if (!skill) return res.json({ success: false, message: 'Skill not found' });

        // Update parents' children lists
        for (const parentName of skill.parents) {
            const parent = await skillUtils.findSkillByName(parentName);
            if (parent) {
                parent.children = parent.children.filter(obj => obj.name != skill.name);
                await parent.save();
            }
        }

        // Update children's parents lists
        for (const childObj of skill.children) {
            const child = await skillUtils.findSkillByName(childObj.name);
            if (child) {
                child.parents = child.parents.filter(p => p != skill.name);
                await child.save();
            }
        }

        // Update skill data
        skill.name = data.name;
        skill.description = data.description;
        skill.descriptionWikipediaURL = data.descriptionWikipediaURL;
        skill.skillIcon = data.skillIcon;
        skill.categoryName = data.categoryName;
        skill.maxPoint = data.maxPoint;
        skill.pointDescription = data.pointDescription;
        skill.parents = data.parents.map(obj => obj.name);
        skill.children = data.children;
        skill.trainings = data.trainings;

        if (data.maxPoint < skill.achievedPoint) skill.achievedPoint = data.maxPoint;
        await skill.save();

        // Update all users who have this skill
        const users = await User.find({ "skills.name": data.name });
        for (const user of users) {
            const userSkill = user.skills.find(obj => obj.name == data.name);

            // Re-link parents/children in user's nested skill list
            // (Maintaining legacy logic of deep nesting updates)
            for (const pName of userSkill.parents) {
                const p = user.skills.find(obj => obj.name == pName);
                if (p) p.children = p.children.filter(c => c.name != userSkill.name);
            }
            for (const cObj of userSkill.children) {
                const c = user.skills.find(obj => obj.name == cObj.name);
                if (c) c.parents = c.parents.filter(p => p != userSkill.name);
            }

            const parentNames = [];
            for (const pData of data.parents) {
                if (!user.skills.find(obj => obj.name == pData.name)) {
                    const parent = await skillUtils.findSkillByName(pData.name);
                    user.skills.push(parent);
                }
                user.skills.find(obj => obj.name == pData.name).children.push({ name: data.name, minPoint: pData.minPoint, recommended: pData.recommended });
                parentNames.push(pData.name);
            }

            for (const cData of data.children) {
                if (!user.skills.find(obj => obj.name == cData.name)) {
                    const child = await skillUtils.findSkillByName(cData.name);
                    user.skills.push(child);
                }
                user.skills.find(obj => obj.name == cData.name).parents.push(data.name);

                const trees = user.trees.filter(t => t.skillNames.includes(cData.name));
                for (const t of trees) {
                    if (!t.skillNames.includes(data.name)) t.skillNames.push(data.name);
                    const skillsToSort = user.skills.filter(s => t.skillNames.includes(s.name));
                    t.skillNames = await treeUtils.sortTree(skillsToSort);
                }
            }

            userSkill.name = data.name;
            userSkill.description = data.description;
            userSkill.descriptionWikipediaURL = data.descriptionWikipediaURL;
            userSkill.skillIcon = data.skillIcon;
            userSkill.categoryName = data.categoryName;
            userSkill.maxPoint = data.maxPoint;
            userSkill.pointDescription = data.pointDescription;
            userSkill.parents = parentNames;
            userSkill.children = data.children;
            userSkill.trainings = data.trainings;

            if (data.maxPoint < userSkill.achievedPoint) userSkill.achievedPoint = data.maxPoint;
            await user.save();
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.approveTree = async (req, res) => {
    try {
        const data = req.body;
        const globalTree = await Tree.findOne({ name: data.name });

        if (!globalTree) {
            const tree = await ApprovableTree.findOne({ username: data.username, name: data.name });
            if (tree) {
                const newTree = new Tree({
                    name: tree.name,
                    focusArea: tree.focusArea,
                    description: tree.description,
                    skillNames: tree.skillNames
                });
                await newTree.save();
                await ApprovableTree.deleteMany({ name: data.name });
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.approveTraining = async (req, res) => {
    try {
        const data = req.body;
        const globalSkill = await skillUtils.findSkillByName(data.skillName);

        if (globalSkill && !globalSkill.trainings.find(obj => obj.name == data.name)) {
            const training = await ApprovableTraining.findOne({
                username: data.username,
                skillName: data.skillName,
                name: data.name
            });

            if (training) {
                const trainingData = {
                    name: training.name,
                    level: training.level,
                    shortDescription: training.shortDescription,
                    URL: training.URL,
                    goal: training.goal,
                    length: training.length,
                    language: training.language
                };
                globalSkill.trainings.push(trainingData);
                await globalSkill.save();

                const users = await User.find({ "skills.name": data.skillName });
                for (const user of users) {
                    user.skills.find(obj => obj.name == data.skillName).trainings.push(trainingData);
                    await user.save();
                }
                await ApprovableTraining.deleteMany({ skillName: data.skillName, name: data.name });
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.dropOffers = async (req, res) => {
    try {
        const skills = await Skill.find({});
        for (const skill of skills) {
            skill.offers = [];
            await skill.save();
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.setAdmin = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        user.admin = !!req.body.give;
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.deleteOne({ username: req.body.username });
        res.json({ success: true, message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.testAdmin = (req, res) => {
    res.json({ success: true });
};
