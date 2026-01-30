const express = require('express');
const router = express.Router();
const treeController = require('../controllers/treeController');

router.post('/searchTreesByName', treeController.searchTreesByName);
router.post('/getPublicTreeData', treeController.getPublicTreeData);
router.post('/addTreeToUser', treeController.addTreeToUser);
router.post('/newtree', treeController.newTree);
router.post('/editmytree', treeController.editMyTree);
router.post('/deletemytree', treeController.deleteMyTree);
router.post('/gettree', treeController.getTreeDetails);

module.exports = router;
