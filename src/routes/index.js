const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const skillRoutes = require('./skill');
const treeRoutes = require('./tree');
const adminRoutes = require('./admin');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.use('/', authRoutes);

// Protected routes (require token)
router.use('/protected', verifyToken, userRoutes);
router.use('/protected', verifyToken, skillRoutes);
router.use('/protected', verifyToken, treeRoutes);

// Admin routes (require admin token)
router.use('/admin', verifyAdmin, adminRoutes);

module.exports = router;
