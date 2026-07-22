const User = require('../models/usermodel');
const Tree = require('../models/treemodel');
const Skill = require('../models/skillmodel');
const Goal = require('../models/goalmodel');

async function getRecommendations(userSkills, userGoals) {
    const skillNames = userSkills.map(s => s.name);
    const targetSkills = [];

    for (const goal of userGoals) {
        const userSkill = userSkills.find(s => s.name === goal.skillName);
        if (!userSkill || (userSkill.achievedPoint || 0) < goal.targetLevel) {
            if (!targetSkills.find(t => t === goal.skillName)) {
                targetSkills.push(goal.skillName);
            }
        }
    }

    if (targetSkills.length === 0) {
        return { mentors: [], paths: [], trainings: [] };
    }

    const mentors = await User.find({
        'skills.name': { $in: targetSkills },
        willingToTeach: true
    });

    const scoredMentors = [];
    for (const targetSkill of targetSkills) {
        for (const mentor of mentors) {
            const skill = mentor.skills.find(s => s.name === targetSkill);
            if (!skill) continue;
            const levelMatch = (skill.achievedPoint || 0) >= 1 ? 1 : 0;
            const locationMatch = mentor.location && userSkills[0] && mentor.location.length > 0 ? 0.5 : 0;
            const score = levelMatch + locationMatch;
            if (!scoredMentors.find(m => m.username === mentor.username)) {
                scoredMentors.push({
                    username: mentor.username,
                    targetSkill,
                    score,
                    willingToTeach: true,
                    location: mentor.location,
                    teachingDay: mentor.teachingDay,
                    teachingTime: mentor.teachingTime
                });
            }
        }
    }
    scoredMentors.sort((a, b) => b.score - a.score);

    const paths = await Tree.find({ skillNames: { $in: targetSkills } });

    const trainings = [];
    for (const ts of targetSkills) {
        const globalSkill = await Skill.findOne({ name: ts });
        if (globalSkill && globalSkill.offers && globalSkill.offers.length > 0) {
            trainings.push({
                skillName: ts,
                offers: globalSkill.offers
            });
        }
    }

    return {
        mentors: scoredMentors.slice(0, 10),
        paths: paths.map(p => ({ name: p.name, skillNames: p.skillNames })),
        trainings
    };
}

exports.getNextSteps = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const goals = await Goal.find({ username: req.decoded.username });
        const result = await getRecommendations(user.skills || [], goals);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMentorsForSkill = async (req, res) => {
    try {
        const { skill } = req.query;
        if (!skill) return res.json({ success: false, message: 'Skill query parameter required.' });

        const mentors = await User.find({
            'skills.name': skill,
            willingToTeach: true
        });

        const result = mentors.map(m => {
            const s = m.skills.find(sk => sk.name === skill);
            return {
                username: m.username,
                skillName: skill,
                achievedPoint: s ? s.achievedPoint : null,
                location: m.location,
                teachingDay: m.teachingDay,
                teachingTime: m.teachingTime
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
