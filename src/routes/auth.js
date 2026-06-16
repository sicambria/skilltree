const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

router.post('/registration', authLimiter, authController.registration);
router.post('/auth', authLimiter, authController.login);

module.exports = router;
