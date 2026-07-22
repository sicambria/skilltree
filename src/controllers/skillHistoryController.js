const SkillHistory = require('../models/skillhistorymodel');

exports.getSkillHistory = async (req, res) => {
    try {
        const { skill } = req.query;
        const query = { username: req.decoded.username };
        if (skill) query.skillName = skill;
        const history = await SkillHistory.find(query).sort({ recordedAt: 1 });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllHistory = async (req, res) => {
    try {
        const history = await SkillHistory.find({ username: req.decoded.username }).sort({ recordedAt: 1 });
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
