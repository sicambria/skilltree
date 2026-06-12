const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');
const ApprovableTree = require('../../../src/models/treesforapprovemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('treeController', () => {
    let treeController;
    let req, res;

    beforeEach(() => {
        treeController = require('../../../src/controllers/treeController');
        req = { body: {}, decoded: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('searchTreesByName', () => {
        it('should search trees by name regex', async () => {
            await Tree.create({ name: 'Web Development' });
            await Tree.create({ name: 'Data Science' });
            req.body = { value: 'Web' };

            await treeController.searchTreesByName(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].name).toBe('Web Development');
        });

        it('should be case insensitive', async () => {
            await Tree.create({ name: 'Python' });
            req.body = { value: 'python' };

            await treeController.searchTreesByName(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
        });

        it('should return empty array for no match', async () => {
            req.body = { value: 'NonExistent' };

            await treeController.searchTreesByName(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });
    });

    describe('getPublicTreeData', () => {
        it('should return trees matching regex', async () => {
            await Tree.create({ name: 'Tree1', focusArea: 'Dev', skillNames: ['A', 'B'] });
            req.body = { value: 'Tree' };

            await treeController.getPublicTreeData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].focusArea).toBe('Dev');
        });
    });

    describe('addTreeToUser', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should add tree to user', async () => {
            await Skill.create({ name: 'SkillA' });
            await Skill.create({ name: 'SkillB' });
            await Tree.create({ name: 'TestTree', focusArea: 'Dev', description: 'Desc', skillNames: ['SkillA', 'SkillB'] });

            req.decoded = { username: 'testuser' };
            req.body = { value: 'TestTree' };

            await treeController.addTreeToUser(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                name: 'TestTree'
            });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.trees.length).toBe(1);
            expect(user.trees[0].name).toBe('TestTree');
        });

        it('should return existing message when tree already in user', async () => {
            await Tree.create({ name: 'ExistingTree', skillNames: ['A'] });
            await Skill.create({ name: 'A', parents: [], children: [] });

            const user = await User.findOne({ username: 'testuser' });
            user.trees.push({ name: 'ExistingTree', skillNames: ['A'] });
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = { value: 'ExistingTree' };

            await treeController.addTreeToUser(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'existing'
            });
        });

        it('should return notfound when tree does not exist', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { value: 'NonExistentTree' };

            await treeController.addTreeToUser(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'notfound'
            });
        });
    });

    describe('newTree', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should create a new tree with sorted skills', async () => {
            const skillData = { name: 'SkillA', categoryName: 'General', parents: [], children: [], trainings: [], achievedPoint: 0 };
            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'MyTree',
                focusArea: 'Dev',
                description: 'My tree',
                skills: [skillData]
            };

            await treeController.newTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.trees.length).toBe(1);
            expect(user.trees[0].name).toBe('MyTree');

            const apprTree = await ApprovableTree.findOne({ name: 'MyTree' });
            expect(apprTree).not.toBeNull();
        });

        it('should reject duplicate tree name', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.trees.push({ name: 'DupTree', skillNames: [] });
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = { name: 'DupTree', skills: [] };

            await treeController.newTree(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'treeexists'
            });
        });
    });

    describe('editMyTree', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: [{ name: 'MyTree', skillNames: ['SkillA'], focusArea: 'Dev', description: 'Original' }]
            });
        });

        it('should edit existing tree', async () => {
            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'MyTree',
                focusArea: 'NewArea',
                description: 'Updated',
                skills: [{ name: 'SkillA', categoryName: 'General', parents: [], children: [], trainings: [] }]
            };

            await treeController.editMyTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.trees[0].focusArea).toBe('NewArea');
            expect(user.trees[0].description).toBe('Updated');
        });

        it('should reject editing non-existent tree', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { name: 'NonExistent', skills: [] };

            await treeController.editMyTree(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'tree not exists'
            });
        });
    });

    describe('deleteMyTree', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: [{ name: 'MyTree', skillNames: [] }]
            });
        });

        it('should delete existing tree', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { name: 'MyTree' };

            await treeController.deleteMyTree(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.trees.length).toBe(0);
        });

        it('should reject deleting non-existent tree', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { name: 'NonExistent' };

            await treeController.deleteMyTree(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'tree not exists'
            });
        });
    });

    describe('getTreeDetails', () => {
        it('should return tree details', async () => {
            await Tree.create({ name: 'MyTree', focusArea: 'Dev', description: 'Desc', skillNames: ['A'] });
            req.body = { name: 'MyTree' };

            await treeController.getTreeDetails(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.name).toBe('MyTree');
            expect(data.description).toBe('Desc');
        });

        it('should return null for non-existent tree', async () => {
            req.body = { name: 'NonExistent' };

            await treeController.getTreeDetails(req, res);

            expect(res.json).toHaveBeenCalledWith(null);
        });
    });
});
