const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/approveskill', adminController.approveSkill);
router.post('/edittree', adminController.editTree);
router.post('/editskill', adminController.editSkill);
router.post('/approvetree', adminController.approveTree);
router.post('/approvetraining', adminController.approveTraining);
router.post('/dropoffers', adminController.dropOffers);
router.post('/setadmin', adminController.setAdmin);
router.post('/deleteUser', adminController.deleteUser);
router.get('/testAdmin', adminController.testAdmin);

module.exports = router;
