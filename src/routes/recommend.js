const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');

router.get('/recommend/next', recommendController.getNextSteps);
router.get('/recommend/mentors', recommendController.getMentorsForSkill);

module.exports = router;
