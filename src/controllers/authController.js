const jwt = require('jsonwebtoken');
const User = require('../models/usermodel');
const Tree = require('../models/treemodel');
const Category = require('../models/categorymodel');
const security = require('../utils/security');
const config = require('../config/config');

// Helper to find user (logic from app.js)
const findUser = async (username) => {
    return await User.findOne({ username });
};

exports.registration = async (req, res) => {
    try {
        const user = await findUser(req.body.username);

        if (!user) {
            const hashData = security.hashPassword(req.body.password);
            const focusAreaTrees = await Tree.find({ focusArea: req.body.focusArea }, { _id: 0, name: 1 });

            const treeNames = focusAreaTrees.map(t => t.name);
            const categories = await Category.find({});

            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                hashData: hashData,
                categories: categories
                // focusArea and willingToTeach omitted in legacy registration logic
            });

            await newUser.save();

            const payload = { username: req.body.username };
            const token = jwt.sign(payload, config.secret, { expiresIn: '1d' });

            res.json({
                success: true,
                token: token,
            });
        } else {
            res.json({ success: false });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });

        if (!user) {
            return res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        }

        if (!security.verifyPassword(req.body.password, user.hashData)) {
            return res.json({
                success: false,
                message: 'Authentication failed. Wrong password.'
            });
        }

        const payload = {
            username: req.body.username,
            admin: user.admin
        };
        const token = jwt.sign(payload, config.secret, { expiresIn: '1d' });

        res.json({
            success: true,
            token: token,
            message: "Authenticated.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during authentication' });
    }
};
