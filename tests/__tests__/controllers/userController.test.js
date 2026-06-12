const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');
const ApprovableTree = require('../../../src/models/treesforapprovemodel');
const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
const ApprovableTraining = require('../../../src/models/trainingsforapprovemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('userController', () => {
    let userController;
    let req, res;

    beforeEach(() => {
        userController = require('../../../src/controllers/userController');
        req = { body: {}, decoded: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getUserData', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                admin: false,
                skills: [],
                trees: []
            });
        });

        it('should return user data without sensitive fields', async () => {
            req.decoded = { username: 'testuser' };

            await userController.getUserData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.username).toBe('testuser');
            expect(data.__v).toBeUndefined();
            expect(data._id).toBeUndefined();
            expect(data.hashData).toBeUndefined();
        });

        it('should include allTreeNames when mainTree is undefined', async () => {
            await Tree.create({ name: 'Tree1' });

            req.decoded = { username: 'testuser' };

            await userController.getUserData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.allTreeNames).toBeDefined();
            expect(data.allTreeNames.length).toBe(1);
        });

        it('should include approval items for admin user', async () => {
            const admin = await User.create({
                username: 'adminuser',
                hashData: Buffer.from('hash'),
                admin: true,
                skills: [],
                trees: [],
                mainTree: 'SomeTree'
            });

            req.decoded = { username: 'adminuser' };

            await userController.getUserData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.apprTrees).toBeDefined();
            expect(data.apprSkills).toBeDefined();
            expect(data.apprTrainings).toBeDefined();
        });

        it('should return error for non-existent user', async () => {
            req.decoded = { username: 'nonexistent' };

            await userController.getUserData(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });
    });

    describe('searchUsersByName', () => {
        it('should search users by username regex', async () => {
            await User.create({ username: 'john_doe' });
            await User.create({ username: 'jane_doe' });
            req.body = { value: 'john' };

            await userController.searchUsersByName(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].name).toBe('john_doe');
        });
    });

    describe('getPublicUserData', () => {
        it('should return public user data', async () => {
            await User.create({
                username: 'publicuser',
                mainTree: 'Tree1',
                willingToTeach: true,
                skills: [],
                trees: []
            });
            req.body = { value: 'publicuser' };

            await userController.getPublicUserData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].username).toBe('publicuser');
            expect(data[0].mainTree).toBe('Tree1');
        });
    });

    describe('endorse', () => {
        beforeEach(async () => {
            await User.create({
                username: 'targetuser',
                skills: [{ name: 'Skill1', parents: [], children: [], trainings: [] }]
            });
        });

        it('should endorse a skill', async () => {
            req.decoded = { username: 'endorser' };
            req.body = { username: 'targetuser', skillName: 'Skill1' };

            await userController.endorse(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'targetuser' });
            expect(user.skills[0].endorsement).toContain('endorser');
        });

        it('should reject duplicate endorsement', async () => {
            const user = await User.findOne({ username: 'targetuser' });
            user.skills[0].endorsement = ['endorser'];
            await user.save();

            req.decoded = { username: 'endorser' };
            req.body = { username: 'targetuser', skillName: 'Skill1' };

            await userController.endorse(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Already endorsed'
            });
        });

        it('should return error for non-existent user', async () => {
            req.decoded = { username: 'endorser' };
            req.body = { username: 'nonexistent', skillName: 'Skill1' };

            await userController.endorse(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });
    });

    describe('updatePassword', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('oldpw')
            });
        });

        it('should update password when old password is correct', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { oldPassword: 'oldpw', newPassword: 'newpw' };

            await userController.updatePassword(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            const security = require('../../../src/utils/security');
            expect(security.verifyPassword('newpw', user.hashData)).toBe(true);
        });

        it('should reject when old password is wrong', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { oldPassword: 'wrongpw', newPassword: 'newpw' };

            await userController.updatePassword(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'wrong password'
            });
        });
    });

    describe('updateLocation', () => {
        beforeEach(async () => {
            await User.create({ username: 'testuser' });
        });

        it('should update location', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { location: 'Budapest' };

            await userController.updateLocation(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.location).toBe('Budapest');
        });
    });

    describe('updateEmail', () => {
        beforeEach(async () => {
            await User.create({ username: 'testuser' });
        });

        it('should update email', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { email: 'new@test.com' };

            await userController.updateEmail(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.email).toBe('new@test.com');
        });
    });

    describe('updateHelp', () => {
        beforeEach(async () => {
            await User.create({ username: 'testuser' });
        });

        it('should update willingToTeach', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { help: true };

            await userController.updateHelp(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.willingToTeach).toBe(true);
        });

        it('should set willingToTeach to false', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { help: false };

            await userController.updateHelp(req, res);

            const user = await User.findOne({ username: 'testuser' });
            expect(user.willingToTeach).toBe(false);
        });
    });

    describe('handleFirstLogin', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should set focus area and main tree', async () => {
            await Skill.create({ name: 'SkillA' });
            await Skill.create({ name: 'SkillB' });
            const tree = await Tree.create({
                name: 'MainTree',
                focusArea: 'Dev',
                skillNames: ['SkillA', 'SkillB']
            });

            req.decoded = { username: 'testuser' };
            req.body = { mainTree: 'MainTree', focusArea: 'Dev' };

            await userController.handleFirstLogin(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.mainTree).toBe('MainTree');
            expect(user.focusArea.name).toBe('Dev');
            expect(user.trees.length).toBe(1);
        });

        it('should return error for non-existent tree', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { mainTree: 'NonExistent', focusArea: 'Dev' };

            await userController.handleFirstLogin(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Tree not found.'
            });
        });
    });
});
