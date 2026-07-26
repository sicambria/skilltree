const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.get('/plan', planController.getPlan);
router.post('/plan', planController.createPlan);
router.patch('/plan/horizon/:horizon', planController.updateHorizon);
router.post('/plan/classify/:horizon', planController.classifyTransition);
router.get('/plan/progress', planController.getPlanProgress);
router.get('/plan/catalog', planController.getSkillCatalog);
router.post('/plan/relational', planController.createRelationalPlan);
router.patch('/plan/wizard-step', planController.updateWizardStep);
router.post('/plan/invite', planController.relationalInvite);
router.post('/plan/join', planController.joinRelationalPlan);
router.get('/plan/relational-progress', planController.getRelationalProgress);

module.exports = router;
