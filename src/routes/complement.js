const express = require('express');
const router = express.Router();
const complementController = require('../controllers/complementController');

router.post('/complement/people', complementController.getComplementaryUsers);
router.post('/complement/group', complementController.getGroupCoverage);

module.exports = router;
