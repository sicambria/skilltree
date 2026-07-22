const User = require('../models/usermodel');
const Skill = require('../models/skillmodel');
const ApprovableSkill = require('../models/skillsforapprovemodel');
const ApprovableTraining = require('../models/trainingsforapprovemodel');
const FeedPost = require('../models/feedpostmodel');
const SkillHistory = require('../models/skillhistorymodel');
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

        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const skillId = data.skillId || `skilltree:skill:${slug}`;
        const reusability = data.reusability || 'cross-sectoral';

        user.skills.push({
            name: data.name,
            skillId: skillId,
            description: data.description,
            descriptionWikipediaURL: data.descriptionWikipediaURL,
            skillIcon: data.skillIcon,
            categoryName: data.categoryName,
            achievedPoint: 0,
            maxPoint: data.maxPoint,
            pointDescription: data.pointDescription,
            reusability: reusability,
            parents: parentNames,
            relationships: data.relationships || [],
            crosswalks: data.crosswalks || {},
            temporal: data.temporal || {},
            trainings: data.trainings || []
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
            skillId: skillId,
            description: data.description,
            descriptionWikipediaURL: data.descriptionWikipediaURL,
            skillIcon: data.skillIcon,
            categoryName: data.categoryName,
            maxPoint: data.maxPoint,
            pointDescription: data.pointDescription,
            reusability: reusability,
            parents: parentNames,
            children: data.children || [],
            relationships: data.relationships || [],
            crosswalks: data.crosswalks || {},
            temporal: data.temporal || {},
            trainings: data.trainings || []
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

function computeEffectiveLevel(assessment) {
    if (!assessment) return null;
    const factors = [assessment.autonomy, assessment.complexity, assessment.influence, assessment.knowledge, assessment.business_skills];
    const valid = factors.filter(f => f != null && f >= 1 && f <= 7);
    if (valid.length === 0) return null;
    return Math.min(...valid);
}

function mapFiveToSeven(level5) {
    if (level5 == null) return null;
    const mapping = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 6 };
    return mapping[level5] || null;
}

function mapSevenToFive(level7) {
    if (level7 == null) return null;
    const mapping = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4, 6: 5, 7: 5 };
    return mapping[level7] || null;
}

exports.submitAll = async (req, res) => {
    try {
        const data = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const levelups = [];
        for (let i = 0; i < data.length; ++i) {
            const skill = user.skills.find(obj => obj.name == data[i].name);
            if (skill) {
                const oldPoint = skill.achievedPoint;
                skill.achievedPoint = data[i].achievedPoint;
                if (data[i].achievedPoint > 0 && data[i].achievedPoint !== oldPoint) {
                    levelups.push({ skillName: skill.name, skillLevel: data[i].achievedPoint });
                }
                if (data[i].assessment) {
                    skill.assessment = {
                        autonomy: data[i].assessment.autonomy,
                        complexity: data[i].assessment.complexity,
                        influence: data[i].assessment.influence,
                        knowledge: data[i].assessment.knowledge,
                        business_skills: data[i].assessment.business_skills,
                        effectiveLevel: computeEffectiveLevel(data[i].assessment)
                    };
                }
            }
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

        for (const lu of levelups) {
            await new SkillHistory({
                username: req.decoded.username,
                skillName: lu.skillName,
                achievedPoint: lu.skillLevel
            }).save();
            await new FeedPost({
                username: req.decoded.username,
                type: 'levelup',
                skillName: lu.skillName,
                skillLevel: lu.skillLevel,
                body: ''
            }).save();
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listSkills = async (req, res) => {
    try {
        const { q, reusability, stage, include, limit, offset } = req.query;
        const filter = {};
        if (q) filter.name = { $regex: q, $options: 'i' };
        if (reusability) filter.reusability = reusability;
        if (stage) filter['temporal.stage'] = stage;
        const lim = Math.min(parseInt(limit) || 50, 200);
        const off = parseInt(offset) || 0;
        const skills = await Skill.find(filter, null, { limit: lim, skip: off });
        const total = await Skill.countDocuments(filter);
        const data = skills.map(s => formatSkillResponse(s, include));
        res.json({ data, meta: { total, count: data.length, version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillById = async (req, res) => {
    try {
        const { include } = req.query;
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        res.json({ data: formatSkillResponse(skill, include), meta: { version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillProficiency = async (req, res) => {
    try {
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        const proficiency = (skill.pointDescription || []).map((desc, i) => ({
            level: i + 1,
            level7: mapFiveToSeven(i + 1),
            label: getLevelLabel(i + 1),
            description: desc
        }));
        res.json({ data: proficiency, meta: { version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillProficiencyLevel = async (req, res) => {
    try {
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        const level = parseInt(req.params.level);
        if (level < 1 || level > 7) return res.status(400).json({ success: false, message: 'Level must be 1-7' });
        const level5 = mapSevenToFive(level);
        const desc = skill.pointDescription[level5 - 1] || null;
        res.json({
            data: {
                level,
                label: getLevelLabel(level),
                description: desc,
                assessment_factors: ['autonomy', 'complexity', 'influence', 'knowledge', 'business_skills']
            },
            meta: { version: '1.0.0' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillCrosswalks = async (req, res) => {
    try {
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        res.json({ data: skill.crosswalks || {}, meta: { version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillRelationships = async (req, res) => {
    try {
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        const rels = (skill.relationships || []).map(r => ({
            skillName: r.skillName,
            type: r.type
        }));
        const parents = (skill.parents || []).map(p => ({ skillName: p, type: 'parent' }));
        const children = (skill.children || []).map(c => ({ skillName: c.name, type: 'child' }));
        res.json({ data: [...parents, ...children, ...rels], meta: { version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillTemporal = async (req, res) => {
    try {
        const skill = await Skill.findOne({
            $or: [{ skillId: req.params.id }, { name: req.params.id }]
        });
        if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
        res.json({ data: skill.temporal || { stage: 'mature' }, meta: { version: '1.0.0' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

function formatSkillResponse(skill, include) {
    const result = {
        id: skill.skillId || `skilltree:skill:${skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: skill.name,
        skillIcon: skill.skillIcon,
        categoryName: skill.categoryName,
        description: skill.description,
        descriptionWikipediaURL: skill.descriptionWikipediaURL,
        reusability: skill.reusability,
        maxPoint: skill.maxPoint,
        level7_max: mapFiveToSeven(skill.maxPoint),
        parents: skill.parents,
        children: (skill.children || []).map(c => ({ name: c.name, minPoint: c.minPoint, recommended: c.recommended }))
    };
    if (include) {
        const includes = include.split(',');
        if (includes.includes('proficiency')) {
            result.proficiency = (skill.pointDescription || []).map((desc, i) => ({
                level: i + 1, level7: mapFiveToSeven(i + 1), description: desc
            }));
        }
        if (includes.includes('crosswalks')) {
            result.crosswalks = skill.crosswalks || {};
        }
        if (includes.includes('relationships')) {
            result.relationships = (skill.relationships || []).map(r => ({
                skillName: r.skillName, type: r.type
            }));
        }
        if (includes.includes('temporal')) {
            result.temporal = skill.temporal || {};
        }
    }
    return result;
}

function getLevelLabel(level7) {
    const labels = { 1: 'Follow', 2: 'Assist', 3: 'Apply', 4: 'Enable', 5: 'Advise', 6: 'Lead', 7: 'Pioneer' };
    return labels[level7] || 'Unknown';
}
