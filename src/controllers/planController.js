const LearningPlan = require('../models/learningplanmodel');
const User = require('../models/usermodel');
const Skill = require('../models/skillmodel');
const crypto = require('crypto');

function computeEffectiveLevel(assessment) {
    if (!assessment) return null;
    const factors = [assessment.autonomy, assessment.complexity, assessment.influence, assessment.knowledge, assessment.business_skills];
    const valid = factors.filter(f => f != null && f >= 1 && f <= 7);
    if (valid.length === 0) return null;
    return Math.min(...valid);
}

function classifyTransitionType(horizon, previousSkills) {
    if (!horizon || !horizon.skills || horizon.skills.length === 0) return null;
    if (!previousSkills || previousSkills.length === 0) return 'broaden';

    const currentNames = horizon.skills.map(s => s.skillName);
    const prevNames = previousSkills.map(s => s.skillName);
    const newSkills = currentNames.filter(n => !prevNames.includes(n));
    const commonSkills = currentNames.filter(n => prevNames.includes(n));

    const overlap = currentNames.length > 0 ? commonSkills.length / Math.max(currentNames.length, prevNames.length) : 0;

    const higherLevels = commonSkills.filter(name => {
        const cur = horizon.skills.find(s => s.skillName === name);
        const prev = previousSkills.find(s => s.skillName === name);
        const curEff = computeEffectiveLevel(cur.targetAssessment);
        const prevEff = computeEffectiveLevel(prev.targetAssessment);
        return curEff !== null && prevEff !== null && curEff > prevEff;
    });

    const hasPromote = currentNames.some(n => n.toLowerCase().includes('management') || n.toLowerCase().includes('leadership'));
    const hasNewSkills = newSkills.length > 0;

    if (overlap < 0.4 && hasNewSkills) return 'pivot';
    if (hasPromote && higherLevels.length > 0) return 'promote';
    if (higherLevels.length > 0 && !hasNewSkills) return 'deepen';
    if (hasNewSkills && overlap >= 0.4) return 'broaden';
    if (overlap >= 0.6 && !higherLevels.length && !hasNewSkills) return 'shift';

    return 'broaden';
}

function computePlanProgress(user, plan) {
    const progress = {};
    for (const horizonKey of ['shortTerm', 'midTerm', 'longTerm']) {
        const horizon = plan.horizons[horizonKey];
        if (!horizon || !horizon.skills) continue;

        progress[horizonKey] = horizon.skills.map(skill => {
            const userSkill = user.skills.find(s => s.name === skill.skillName);
            const current = userSkill ? userSkill.assessment : null;
            const target = skill.targetAssessment;

            return {
                skillName: skill.skillName,
                target,
                current: current ? {
                    autonomy: current.autonomy,
                    complexity: current.complexity,
                    influence: current.influence,
                    knowledge: current.knowledge,
                    business_skills: current.business_skills,
                    effectiveLevel: current.effectiveLevel
                } : { achievedPoint: userSkill ? userSkill.achievedPoint : null },
                targetEffectiveLevel: computeEffectiveLevel(target),
                currentEffectiveLevel: current ? current.effectiveLevel : (userSkill ? userSkill.achievedPoint : null)
            };
        });
    }
    return progress;
}

exports.createPlan = async (req, res) => {
    try {
        const { title, description } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const existing = await LearningPlan.findOne({ username: req.decoded.username });
        if (existing) return res.json({ success: false, message: 'Plan already exists.' });

        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        const threeYears = new Date();
        threeYears.setFullYear(threeYears.getFullYear() + 3);

        const plan = new LearningPlan({
            username: req.decoded.username,
            title: title || `${req.decoded.username}'s Learning Plan`,
            description: description || '',
            horizons: {
                shortTerm: { targetDate: threeMonths, skills: [] },
                midTerm: { targetDate: oneYear, skills: [] },
                longTerm: { targetDate: threeYears, skills: [] }
            }
        });
        await plan.save();
        res.json({ success: true, plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPlan = async (req, res) => {
    try {
        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });
        res.json(plan);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateHorizon = async (req, res) => {
    try {
        const { horizon } = req.params;
        if (!['shortTerm', 'midTerm', 'longTerm'].includes(horizon)) {
            return res.json({ success: false, message: 'Invalid horizon. Use shortTerm, midTerm, or longTerm.' });
        }

        const { skills } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });

        plan.horizons[horizon].skills = skills || [];
        plan.updatedAt = new Date();
        await plan.save();
        res.json({ success: true, plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.classifyTransition = async (req, res) => {
    try {
        const { horizon } = req.params;
        if (!['shortTerm', 'midTerm', 'longTerm'].includes(horizon)) {
            return res.json({ success: false, message: 'Invalid horizon.' });
        }

        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });

        const currentHorizon = plan.horizons[horizon];
        const horizonKeys = ['shortTerm', 'midTerm', 'longTerm'];
        const idx = horizonKeys.indexOf(horizon);
        const previousHorizon = idx > 0 ? plan.horizons[horizonKeys[idx - 1]] : null;

        const type = classifyTransitionType(currentHorizon, previousHorizon ? previousHorizon.skills : []);
        plan.horizons[horizon].transitionType = type;
        plan.updatedAt = new Date();
        await plan.save();

        res.json({ success: true, transitionType: type, plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getPlanProgress = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });

        const progress = computePlanProgress(user, plan);
        res.json({ username: req.decoded.username, progress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSkillCatalog = async (req, res) => {
    try {
        const curatedCategories = ['Human Skills', 'Emotional Intelligence', 'Cognitive Skills', 'Regenerative Practices', 'Ecovillage Design', 'Permaculture'];
        const skills = await Skill.find({ categoryName: { $in: curatedCategories } });
        const catalog = {};
        curatedCategories.forEach(cat => {
            catalog[cat] = skills.filter(s => s.categoryName === cat).map(s => ({
                name: s.name,
                categoryName: s.categoryName,
                description: s.description,
                skillIcon: s.skillIcon,
                reusability: s.reusability,
                relationships: s.relationships,
                parents: s.parents,
                maxPoint: s.maxPoint
            }));
        });
        res.json({ success: true, catalog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createRelationalPlan = async (req, res) => {
    try {
        const { partnerUsername } = req.body;
        if (!partnerUsername) return res.json({ success: false, message: 'Partner username required.' });

        const partner = await User.findOne({ username: partnerUsername });
        if (!partner) return res.json({ success: false, message: 'Partner not found.' });

        const owner = req.decoded.username;
        if (partnerUsername === owner) return res.json({ success: false, message: 'Cannot create relational plan with yourself.' });

        const threeMonths = new Date();
        threeMonths.setMonth(threeMonths.getMonth() + 3);
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        const threeYears = new Date();
        threeYears.setFullYear(threeYears.getFullYear() + 3);

        const plan = new LearningPlan({
            username: owner,
            title: `${owner} & ${partnerUsername}'s Learning Plan`,
            description: '',
            type: 'relational',
            participants: [owner, partnerUsername],
            horizons: {
                shortTerm: { targetDate: threeMonths, skills: [] },
                midTerm: { targetDate: oneYear, skills: [] },
                longTerm: { targetDate: threeYears, skills: [] }
            }
        });
        await plan.save();
        res.json({ success: true, plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateWizardStep = async (req, res) => {
    try {
        const { step } = req.body;
        if (step == null || step < 0 || step > 5) {
            return res.json({ success: false, message: 'Invalid step. Must be 0-5.' });
        }

        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });

        plan.wizardStep = step;
        plan.updatedAt = new Date();
        await plan.save();
        res.json({ success: true, wizardStep: step });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.relationalInvite = async (req, res) => {
    try {
        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });
        if (plan.type !== 'relational') return res.json({ success: false, message: 'Not a relational plan.' });

        let inviteCode;
        let retries = 3;
        while (retries > 0) {
            inviteCode = crypto.randomBytes(3).toString('hex');
            const existing = await LearningPlan.findOne({ inviteCode });
            if (!existing) break;
            retries--;
        }
        if (!inviteCode) return res.status(500).json({ success: false, message: 'Could not generate unique invite code.' });

        plan.inviteCode = inviteCode;
        plan.updatedAt = new Date();
        await plan.save();
        res.json({ success: true, inviteCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.joinRelationalPlan = async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) return res.json({ success: false, message: 'Invite code required.' });

        const plan = await LearningPlan.findOne({ inviteCode });
        if (!plan) return res.json({ success: false, message: 'Invalid invite code.' });
        if (plan.type !== 'relational') return res.json({ success: false, message: 'Not a relational plan.' });
        if (plan.participants.length >= 2) return res.json({ success: false, message: 'Plan already has 2 participants.' });

        const username = req.decoded.username;
        if (plan.participants.includes(username)) return res.json({ success: false, message: 'Already a participant.' });

        plan.participants.push(username);
        plan.updatedAt = new Date();
        await plan.save();
        res.json({ success: true, plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRelationalProgress = async (req, res) => {
    try {
        const plan = await LearningPlan.findOne({ username: req.decoded.username });
        if (!plan) return res.json({ success: false, message: 'No plan found.' });
        if (plan.type !== 'relational') return res.json({ success: false, message: 'Not a relational plan.' });

        const participants = plan.participants || [];
        const users = await User.find({ username: { $in: participants } });
        const userMap = {};
        users.forEach(u => { userMap[u.username] = u; });

        const relationalProgress = {};
        for (const username of participants) {
            const user = userMap[username];
            if (!user) {
                relationalProgress[username] = null;
                continue;
            }
            relationalProgress[username] = computePlanProgress(user, plan);
        }

        res.json({ success: true, participants, progress: relationalProgress });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
