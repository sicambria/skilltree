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

const validateUsername = (username) => typeof username === 'string' && username.length >= 2 && username.length <= 50;
const validatePassword = (password) => typeof password === 'string' && password.length >= 4;
const validateEmail = (email) => typeof email === 'string' && email.length <= 254;

exports.registration = async (req, res) => {
    try {
        const username = (req.body.username || '').toString().trim();
        const password = req.body.password || '';
        const email = (req.body.email || '').toString().trim();

        if (!validateUsername(username)) {
            return res.status(400).json({ success: false, message: 'Username must be 2-50 characters.' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });
        }
        if (email && !validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email.' });
        }

        const user = await findUser(username);

        if (!user) {
            const hashData = security.hashPassword(password);
            const focusAreaTrees = await Tree.find({ focusArea: req.body.focusArea }, { _id: 0, name: 1 });

            const treeNames = focusAreaTrees.map(t => t.name);
            const categories = await Category.find({});

            const newUser = new User({
                username: username,
                email: email,
                hashData: hashData,
                categories: categories
            });

            await newUser.save();

            const payload = { username: username };
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
        const username = (req.body.username || '').toString().trim();
        const password = req.body.password || '';

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password required.' });
        }

        const user = await User.findOne({ username: username });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        }

        if (!security.verifyPassword(password, user.hashData)) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. Wrong password.'
            });
        }

        const payload = {
            username: username,
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
