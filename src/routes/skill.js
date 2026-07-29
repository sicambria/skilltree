const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');

router.post('/offers', skillController.getOffers);
router.get('/skillsforapproval', skillController.getSkillsForApproval);
router.post('/searchSkillsByName', skillController.searchSkillsByName);
router.post('/searchUserSkillsByName', skillController.searchUserSkillsByName);
router.post('/getPublicSkillData', skillController.getPublicSkillData);
router.post('/getskill', skillController.getSkillDetails);
router.post('/newskill', skillController.newSkill);
router.post('/newtraining', skillController.newTraining);
router.post('/submitall', skillController.submitAll);

router.get('/skills/catalog/all', skillController.getSkillCatalog);
router.get('/skills/catalog', skillController.getSkillCatalog);
router.get('/skills', skillController.listSkills);
router.get('/skills/:id', skillController.getSkillById);
router.get('/skills/:id/proficiency', skillController.getSkillProficiency);
router.get('/skills/:id/proficiency/:level', skillController.getSkillProficiencyLevel);
router.get('/skills/:id/crosswalks', skillController.getSkillCrosswalks);
router.get('/skills/:id/relationships', skillController.getSkillRelationships);
router.get('/skills/:id/temporal', skillController.getSkillTemporal);

module.exports = router;
