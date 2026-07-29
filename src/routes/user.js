const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/userdata', userController.getUserData);
router.post('/searchUsersByName', userController.searchUsersByName);
router.post('/getPublicUserData', userController.getPublicUserData);
router.post('/endorse', userController.endorse);
router.post('/newpassword', userController.updatePassword);
router.post('/newplace', userController.updateLocation);
router.post('/newemail', userController.updateEmail);
router.post('/newhelp', userController.updateHelp);
router.post('/firstlogindata', userController.handleFirstLogin);
router.post('/onboarding/depth', userController.handleDepthOnboarding);
router.get('/onboarding/domains', userController.getSkillDomains);
router.post('/profile/export', userController.exportProfile);
router.post('/profile/import', userController.importProfile);

module.exports = router;
