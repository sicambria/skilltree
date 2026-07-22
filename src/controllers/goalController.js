const Goal = require('../models/goalmodel');
const User = require('../models/usermodel');

exports.createGoal = async (req, res) => {
    try {
        const { title, skillName, targetLevel, targetDate, collaborators, notes } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const goal = new Goal({
            username: req.decoded.username,
            title,
            skillName,
            targetLevel,
            targetDate,
            collaborators: collaborators || [],
            notes
        });
        await goal.save();
        res.json({ success: true, goal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getMyGoals = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const goals = await Goal.find({
            $or: [
                { username: req.decoded.username },
                { collaborators: req.decoded.username }
            ]
        }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { goalId, title, skillName, targetLevel, targetDate, notes } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const goal = await Goal.findById(goalId);
        if (!goal) return res.json({ success: false, message: 'Goal not found.' });
        if (goal.username !== req.decoded.username) {
            return res.json({ success: false, message: 'Not authorized.' });
        }

        if (title !== undefined) goal.title = title;
        if (skillName !== undefined) goal.skillName = skillName;
        if (targetLevel !== undefined) goal.targetLevel = targetLevel;
        if (targetDate !== undefined) goal.targetDate = targetDate;
        if (notes !== undefined) goal.notes = notes;
        await goal.save();
        res.json({ success: true, goal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.shareTimeline = async (req, res) => {
    try {
        const { goalId, recipientUsername } = req.body;
        const user = await User.findOne({ username: req.decoded.username });
        if (!user) return res.json({ success: false, message: 'User not found.' });

        const recipient = await User.findOne({ username: recipientUsername });
        if (!recipient) return res.json({ success: false, message: 'Recipient not found.' });

        const goal = await Goal.findById(goalId);
        if (!goal) return res.json({ success: false, message: 'Goal not found.' });

        if (goal.collaborators.includes(recipientUsername)) {
            return res.json({ success: false, message: 'Already a collaborator.' });
        }

        goal.collaborators.push(recipientUsername);
        await goal.save();
        res.json({ success: true, goal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
