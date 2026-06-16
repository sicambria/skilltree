const User = require('../models/usermodel');
const Skill = require('../models/skillmodel');
const ApprovableSkill = require('../models/skillsforapprovemodel');
const ApprovableTraining = require('../models/trainingsforapprovemodel');
const treeUtils = require('../utils/treeUtils');

exports.getOffers = async (req, res) => {
    try {
        const skilldata = await Skill.findOne({ name: req.body.name });
        if (!skilldata) {
            return res.json({ success: false, message: 'Skill not found.' });
        }
        res.json(skilldata);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillsForApproval = async (req, res) => {
    try {
        const skills = await ApprovableSkill.find({});
        if (skills) {
            res.json(skills);
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchSkillsByName = async (req, res) => {
    try {
        const data = req.body;
        const searchValue = (data.value || '').toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: req.decoded.username });
        const foundUserSkills = user.skills.filter(obj => obj.name.match(new RegExp(".*" + searchValue + ".*", "i")) != null);
        const foundGlobalSkills = await Skill.find({
            "name": { $regex: ".*" + searchValue + ".*", '$options': 'i' }
        });

        const resSkills = foundUserSkills.map(s => ({ name: s.name }));
        foundGlobalSkills.forEach(gs => {
            if (!resSkills.find(s => s.name === gs.name)) {
                resSkills.push({ name: gs.name });
            }
        });
        res.json(resSkills);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.searchUserSkillsByName = async (req, res) => {
    try {
        const data = req.body;
        const searchValue = (data.value || '').toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: req.decoded.username });
        const foundUserSkills = user.skills.filter(obj => obj.name.match(new RegExp(".*" + searchValue + ".*", "i")) != null);
        res.json(foundUserSkills.map(s => ({ name: s.name })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPublicSkillData = async (req, res) => {
    try {
        const data = req.body;
        const searchValue = (data.value || '').toString().trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let outData = [];
        const foundSkills = await Skill.find({
            "name": { $regex: ".*" + searchValue + ".*", '$options': 'i' }
        }, 'name categoryName description descriptionWikipediaURL pointDescription');

        for (let s = 0; s < foundSkills.length; s++) {
            const foundUsers = await User.find({ "skills.name": foundSkills[s].name }, 'username skills');
            const outUsers = foundUsers.map(u => ({
                username: u.username,
                skill: u.skills.find(obj => obj.name == foundSkills[s].name)
            }));

            outData.push({
                name: foundSkills[s].name,
                categoryName: foundSkills[s].categoryName,
                description: foundSkills[s].description,
                descriptionWikipediaURL: foundSkills[s].descriptionWikipediaURL,
                pointDescription: foundSkills[s].pointDescription,
                users: outUsers
            });
        }
        res.json(outData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillDetails = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        let skill = user.skills.find(obj => obj.name == data.value);
        if (!skill) {
            skill = await Skill.findOne({ name: data.value });
            if (!skill) return res.json({ success: false });
        }

        const dependency = [];
        await treeUtils.getDependency(user.skills, skill, dependency);

        res.json({
            success: true,
            skill: skill,
            dependency: dependency
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.newSkill = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });

        if (!user) return res.json({ success: false, message: 'User not found.' });
        if (user.skills.find(obj => obj.name == data.name)) {
            return res.json({ success: false, message: 'skillexists' });
        }

        const parentNames = [];
        for (let i = 0; i < data.parents.length; ++i) {
            if (!user.skills.find(obj => obj.name == data.parents[i].name)) {
                const parent = await Skill.findOne({ name: data.parents[i].name });
                if (parent) user.skills.push(parent);
            }
            const userParent = user.skills.find(obj => obj.name == data.parents[i].name);
            if (userParent) {
                userParent.children.push({ name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended });
            }
            parentNames.push(data.parents[i].name);
        }

        user.skills.push({
            name: data.name,
            description: data.description,
            descriptionWikipediaURL: data.descriptionWikipediaURL,
            skillIcon: data.skillIcon,
            categoryName: data.categoryName,
            achievedPoint: 0,
            maxPoint: data.maxPoint,
            pointDescription: data.pointDescription,
            parents: parentNames,
            trainings: data.trainings
        });

        await user.save();

        for (let i = 0; i < data.parents.length; ++i) {
            const apprParent = await ApprovableSkill.findOne({ name: data.parents[i].name });
            if (apprParent) {
                apprParent.children.push({ name: data.name, minPoint: data.parents[i].minPoint, recommended: data.parents[i].recommended });
                await apprParent.save();
            }
        }

        const apprSkill = new ApprovableSkill({
            username: user.username,
            name: data.name,
            description: data.description,
            descriptionWikipediaURL: data.descriptionWikipediaURL,
            skillIcon: data.skillIcon,
            categoryName: data.categoryName,
            maxPoint: data.maxPoint,
            pointDescription: data.pointDescription,
            parents: parentNames,
            children: data.children,
            trainings: data.trainings
        });
        await apprSkill.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.newTraining = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });

        if (!user) return res.json({ success: false, message: 'User not found.' });
        const userSkill = user.skills.find(obj => obj.name == data.skillName);

        if (userSkill) {
            data.trainings.forEach(t => {
                userSkill.trainings.push(t);
            });
            await user.save();

            for (const t of data.trainings) {
                const apprTraining = new ApprovableTraining({
                    username: user.username,
                    skillName: data.skillName,
                    ...t
                });
                await apprTraining.save();
            }
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'skillnotexists' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.submitAll = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        for (let i = 0; i < data.length; ++i) {
            const skill = user.skills.find(obj => obj.name == data[i].name);
            if (skill) skill.achievedPoint = data[i].achievedPoint;
        }

        if (user.willingToTeach) {
            const globalSkills = await Skill.find({});
            for (const userSkill of data) {
                const globalSkill = globalSkills.find(obj => obj.name == userSkill.name);
                if (globalSkill) {
                    if (userSkill.achievedPoint > 0) {
                        const offer = globalSkill.offers.find(obj => obj.username == user.username);
                        if (!offer) {
                            globalSkill.offers.push({
                                username: user.username,
                                location: user.location,
                                teachingDay: user.teachingDay,
                                teachingTime: user.teachingTime,
                                achievedPoint: userSkill.achievedPoint,
                            });
                        } else {
                            offer.achievedPoint = userSkill.achievedPoint;
                        }
                    } else {
                        globalSkill.offers = globalSkill.offers.filter(obj => obj.username != user.username);
                    }
                    await globalSkill.save();
                }
            }
        }
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
