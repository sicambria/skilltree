const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');
const { verifyToken } = require('../middleware/auth');

router.get('/data', verifyToken, graphController.getGraphData);

module.exports = router;
