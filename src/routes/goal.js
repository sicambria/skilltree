const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.post('/goals/create', goalController.createGoal);
router.get('/goals', goalController.getMyGoals);
router.post('/goals/update', goalController.updateGoal);
router.post('/goals/share', goalController.shareTimeline);

module.exports = router;
