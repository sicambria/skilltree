const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.get('/plan', planController.getPlan);
router.post('/plan', planController.createPlan);
router.patch('/plan/horizon/:horizon', planController.updateHorizon);
router.post('/plan/classify/:horizon', planController.classifyTransition);
router.get('/plan/progress', planController.getPlanProgress);

module.exports = router;
