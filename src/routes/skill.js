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

module.exports = router;
