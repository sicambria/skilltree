const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');
const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
const ApprovableTraining = require('../../../src/models/trainingsforapprovemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('skillController', () => {
    let skillController;
    let req, res;

    beforeEach(() => {
        skillController = require('../../../src/controllers/skillController');
        req = { body: {}, decoded: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getOffers', () => {
        it('should return skill data when found', async () => {
            await Skill.create({ name: 'JS', offers: [{ username: 'u1', teachingDay: 'Mon' }] });
            req.body = { name: 'JS' };

            await skillController.getOffers(req, res);

            expect(res.json).toHaveBeenCalled();
            const data = res.json.mock.calls[0][0];
            expect(data.name).toBe('JS');
            expect(data.offers.length).toBe(1);
        });

        it('should return error when skill not found', async () => {
            req.body = { name: 'NonExistent' };

            await skillController.getOffers(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Skill not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { name: 'test' };

            await skillController.getOffers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getSkillsForApproval', () => {
        it('should return all approvable skills', async () => {
            await ApprovableSkill.create({ name: 'Skill1', username: 'u1' });

            await skillController.getSkillsForApproval(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].name).toBe('Skill1');
        });

        it('should return empty array when none exist', async () => {
            await skillController.getSkillsForApproval(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data).toEqual([]);
        });
    });

    describe('searchSkillsByName', () => {
        beforeEach(async () => {
            await User.create({
                username: 'testuser',
                skills: [{ name: 'UserSkill', parents: [], children: [], trainings: [] }]
            });
            await Skill.create({ name: 'GlobalSkill' });
        });

        it('should search user and global skills', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { value: 'Skill' };

            await skillController.searchSkillsByName(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(2);
            const names = data.map(s => s.name);
            expect(names).toContain('UserSkill');
            expect(names).toContain('GlobalSkill');
        });

        it('should not duplicate skills present in both', async () => {
            await Skill.create({ name: 'UserSkill' });
            req.decoded = { username: 'testuser' };
            req.body = { value: 'UserSkill' };

            await skillController.searchSkillsByName(req, res);

            const data = res.json.mock.calls[0][0];
            const userSkillCount = data.filter(s => s.name === 'UserSkill').length;
            expect(userSkillCount).toBe(1);
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { value: 'test' };

            await skillController.searchSkillsByName(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('searchUserSkillsByName', () => {
        it('should search only user skills', async () => {
            await User.create({
                username: 'testuser',
                skills: [{ name: 'UserA', parents: [], children: [], trainings: [] }, { name: 'UserB', parents: [], children: [], trainings: [] }]
            });
            req.decoded = { username: 'testuser' };
            req.body = { value: 'UserA' };

            await skillController.searchUserSkillsByName(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].name).toBe('UserA');
        });
    });

    describe('getPublicSkillData', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'PublicSkill', categoryName: 'General' });
            await User.create({
                username: 'skillowner',
                skills: [{ name: 'PublicSkill', parents: [], children: [], trainings: [] }]
            });
        });

        it('should return skill data with users', async () => {
            req.body = { value: 'PublicSkill' };

            await skillController.getPublicSkillData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].name).toBe('PublicSkill');
            expect(data[0].users.length).toBe(1);
            expect(data[0].users[0].username).toBe('skillowner');
        });

        it('should return empty array for no matches', async () => {
            req.body = { value: 'NonExistent' };

            await skillController.getPublicSkillData(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data).toEqual([]);
        });
    });

    describe('getSkillDetails', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'MySkill', parents: [], children: [], trainings: [] }]
            });
        });

        it('should return skill from user skills', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { value: 'MySkill' };

            await skillController.getSkillDetails(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.skill.name).toBe('MySkill');
        });

        it('should fetch from global skills if not in user skills', async () => {
            await Skill.create({ name: 'GlobalOnly' });
            req.decoded = { username: 'testuser' };
            req.body = { value: 'GlobalOnly' };

            await skillController.getSkillDetails(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.skill.name).toBe('GlobalOnly');
        });

        it('should return empty result for unknown skill', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { value: 'Unknown' };

            await skillController.getSkillDetails(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: false });
        });
    });

    describe('newSkill', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: []
            });
        });

        it('should create new skill for user and approvable skill', async () => {
            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'NewSkill',
                description: 'A new skill',
                categoryName: 'General',
                maxPoint: 5,
                parents: [],
                children: [],
                trainings: []
            };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.skills.length).toBe(1);
            expect(user.skills[0].name).toBe('NewSkill');

            const apprSkill = await ApprovableSkill.findOne({ name: 'NewSkill' });
            expect(apprSkill).not.toBeNull();
        });

        it('should reject duplicate skill', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.skills.push({ name: 'Duplicate', parents: [], children: [], trainings: [] });
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = { name: 'Duplicate', parents: [] };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'skillexists'
            });
        });
    });

    describe('newTraining', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'Skill1', parents: [], children: [], trainings: [] }]
            });
        });

        it('should add training to user skill and create approvable training', async () => {
            req.decoded = { username: 'testuser' };
            req.body = {
                skillName: 'Skill1',
                trainings: [{ name: 'Course1', level: 1, shortDescription: 'Intro', URL: 'http://example.com', goal: 'Learn', length: 10, language: 'en' }]
            };

            await skillController.newTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const apprTraining = await ApprovableTraining.findOne({ skillName: 'Skill1' });
            expect(apprTraining).not.toBeNull();
            expect(apprTraining.name).toBe('Course1');
        });

        it('should reject when skill does not exist', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { skillName: 'NonExistent', trainings: [] };

            await skillController.newTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'skillnotexists'
            });
        });
    });

    describe('submitAll', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                willingToTeach: false,
                skills: [{ name: 'Skill1', achievedPoint: 0, parents: [], children: [], trainings: [] }]
            });
        });

        it('should update skill achieved points', async () => {
            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 3 }];

            await skillController.submitAll(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.skills[0].achievedPoint).toBe(3);
        });

        it('should handle willingToTeach with offers', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.willingToTeach = true;
            user.location = 'NYC';
            user.teachingDay = 'Mon';
            user.teachingTime = '10:00';
            await user.save();

            await Skill.create({ name: 'Skill1', offers: [] });

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 4 }];

            await skillController.submitAll(req, res);

            const globalSkill = await Skill.findOne({ name: 'Skill1' });
            expect(globalSkill.offers.length).toBe(1);
            expect(globalSkill.offers[0].username).toBe('testuser');
            expect(globalSkill.offers[0].achievedPoint).toBe(4);
        });

        it('should remove offer when achievedPoint is 0', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.willingToTeach = true;
            await user.save();

            await Skill.create({
                name: 'Skill1',
                offers: [{ username: 'testuser', achievedPoint: 2, location: 'NYC', teachingDay: 'Mon', teachingTime: '10:00' }]
            });

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 0 }];

            await skillController.submitAll(req, res);

            const globalSkill = await Skill.findOne({ name: 'Skill1' });
            expect(globalSkill.offers.length).toBe(0);
        });
    });
});
