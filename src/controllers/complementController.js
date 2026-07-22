const User = require('../models/usermodel');
const Skill = require('../models/skillmodel');

exports.getComplementaryUsers = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const userSkillNames = (user.skills || []).map(s => s.name);

        const candidateSkills = req.body.skillNames || userSkillNames;

        const mySkillRelationships = await Skill.find({ name: { $in: candidateSkills } });

        const adjMap = {};
        for (const s of mySkillRelationships) {
            for (const rel of (s.relationships || [])) {
                if (!adjMap[rel.skillName]) {
                    adjMap[rel.skillName] = { skillName: rel.skillName, type: rel.type };
                } else if (rel.type === 'complement') {
                    adjMap[rel.skillName].type = 'complement';
                }
            }
        }

        const gapSkillNames = Object.keys(adjMap).filter(n => !userSkillNames.includes(n));

        const candidates = await User.find({}, 'username skills.name skills.assessment willingToTeach location');

        const results = [];
        for (const candidate of candidates) {
            if (candidate.username === req.decoded.username) continue;
            const commonSkills = (candidate.skills || [])
                .filter(s => userSkillNames.includes(s.name))
                .map(s => s.name);

            const gaps = [];
            for (const gapName of gapSkillNames) {
                const candidateHas = (candidate.skills || []).find(s => s.name === gapName);
                if (!candidateHas) continue;
                const type = adjMap[gapName].type;
                const candidateLevel = candidateHas.assessment ? candidateHas.assessment.effectiveLevel : null;
                const score = 0.6 * (type === 'complement' ? 1 : type === 'prerequisite' ? 0.8 : type === 'substitute' ? 0.6 : 0.4)
                    + 0.4 * ((candidateLevel || 1) / 7);
                gaps.push({ skillName: gapName, type, score: Math.round(score * 100) / 100 });
            }

            gaps.sort((a, b) => {
                const typeOrder = { complement: 0, prerequisite: 1, substitute: 2, adjacent: 3 };
                const aOrd = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 4;
                const bOrd = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 4;
                if (aOrd !== bOrd) return aOrd - bOrd;
                return b.score - a.score;
            });

            results.push({
                username: candidate.username,
                commonSkills,
                gaps,
                willingToTeach: candidate.willingToTeach,
                location: candidate.location
            });
        }

        results.sort((a, b) => {
            const typeOrder = { complement: 0, prerequisite: 1, substitute: 2, adjacent: 3 };
            const aMinOrd = a.gaps.length > 0
                ? (typeOrder[a.gaps[0].type] !== undefined ? typeOrder[a.gaps[0].type] : 4) : 4;
            const bMinOrd = b.gaps.length > 0
                ? (typeOrder[b.gaps[0].type] !== undefined ? typeOrder[b.gaps[0].type] : 4) : 4;
            if (aMinOrd !== bMinOrd) return aMinOrd - bMinOrd;
            return b.gaps.length - a.gaps.length;
        });

        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getGroupCoverage = async (req, res) => {
    try {
        const { usernames } = req.body;
        if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
            return res.json({ success: false, message: 'Usernames array required.' });
        }

        const users = await User.find({ username: { $in: usernames } }, 'username skills.name');

        const coverage = {};
        const allCovered = new Set();

        for (const u of users) {
            for (const s of (u.skills || [])) {
                if (!coverage[s.name]) coverage[s.name] = [];
                if (!coverage[s.name].includes(u.username)) {
                    coverage[s.name].push(u.username);
                }
                allCovered.add(s.name);
            }
        }

        const allSkills = await Skill.find({}, 'name relationships');
        const globalSkillNames = allSkills.map(s => s.name);

        const gaps = globalSkillNames.filter(n => !allCovered.has(n)).map(n => {
            const skill = allSkills.find(s => s.name === n);
            let type = 'adjacent';
            if (skill && skill.relationships && skill.relationships.length > 0) {
                const relTypes = skill.relationships.map(r => r.type);
                if (relTypes.includes('complement')) type = 'complement';
                else if (relTypes.includes('prerequisite')) type = 'prerequisite';
                else if (relTypes.includes('substitute')) type = 'substitute';
            }
            return { skillName: n, type };
        });

        const coverageArr = Object.entries(coverage).map(([skillName, usernames]) => {
            let type = 'unknown';
            const skill = allSkills.find(s => s.name === skillName);
            if (skill && skill.relationships && skill.relationships.length > 0) {
                const relTypes = skill.relationships.map(r => r.type);
                if (relTypes.includes('complement')) type = 'complement';
                else if (relTypes.includes('prerequisite')) type = 'prerequisite';
                else if (relTypes.includes('substitute')) type = 'substitute';
            }
            return { skillName, usernames, type };
        });

        res.json({ coverage: coverageArr, gaps });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
