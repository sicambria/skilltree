const express = require('express');
const router = express.Router();
const skillHistoryController = require('../controllers/skillHistoryController');

router.get('/history', skillHistoryController.getSkillHistory);
router.get('/allHistory', skillHistoryController.getAllHistory);

module.exports = router;
