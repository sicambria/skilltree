const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');

router.get('/feed', feedController.getFeed);
router.post('/feed', feedController.createPost);
router.post('/feed/comment', feedController.createComment);
router.post('/feed/delete', feedController.deletePost);

module.exports = router;
