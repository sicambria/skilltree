const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const userRoutes = require('./user');
const skillRoutes = require('./skill');
const treeRoutes = require('./tree');
const graphRoutes = require('./graph');
const feedRoutes = require('./feed');
const goalRoutes = require('./goal');
const skillHistoryRoutes = require('./skillHistory');
const recommendRoutes = require('./recommend');
const complementRoutes = require('./complement');
const planRoutes = require('./plan');
const adminRoutes = require('./admin');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public routes
router.use('/', authRoutes);

// Protected routes (require token)
router.use('/protected', verifyToken, userRoutes);
router.use('/protected', verifyToken, skillRoutes);
router.use('/protected', verifyToken, treeRoutes);
router.use('/protected', verifyToken, feedRoutes);
router.use('/protected', verifyToken, goalRoutes);
router.use('/protected', verifyToken, skillHistoryRoutes);
router.use('/protected', verifyToken, recommendRoutes);
router.use('/protected', verifyToken, complementRoutes);
router.use('/protected', verifyToken, planRoutes);
router.use('/graph', graphRoutes);

// Admin routes (require admin token)
router.use('/admin', verifyAdmin, adminRoutes);

module.exports = router;
