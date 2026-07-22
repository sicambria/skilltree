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

        it('should return success false when find returns falsy', async () => {
            jest.spyOn(ApprovableSkill, 'find').mockResolvedValue(null);

            await skillController.getSkillsForApproval(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: false });
            jest.restoreAllMocks();
        });

        it('should handle server error', async () => {
            jest.spyOn(ApprovableSkill, 'find').mockRejectedValue(new Error('DB error'));

            await skillController.getSkillsForApproval(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should handle regex special characters in search (lines 37, 60, 73 sanitization)', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { value: '.*+?^${}()|[\\]\\\\' };

            await skillController.searchSkillsByName(req, res);

            expect(res.status).not.toHaveBeenCalledWith(500);
            expect(Array.isArray(res.json.mock.calls[0][0])).toBe(true);
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

        it('should handle regex special characters (line 60 sanitization)', async () => {
            await User.create({
                username: 'regexuser',
                skills: [{ name: 'RegexSkill', parents: [], children: [], trainings: [] }]
            });
            req.decoded = { username: 'regexuser' };
            req.body = { value: '.*+?^${}()|[\\]\\\\' };

            await skillController.searchUserSkillsByName(req, res);

            expect(res.status).not.toHaveBeenCalledWith(500);
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { value: 'test' };

            await skillController.searchUserSkillsByName(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should handle regex special characters in public search (line 73 sanitization)', async () => {
            req.body = { value: '.*+?^${}()|[\\]\\\\' };

            await skillController.getPublicSkillData(req, res);

            expect(res.status).not.toHaveBeenCalledWith(500);
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));
            req.body = { value: 'test' };

            await skillController.getPublicSkillData(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { value: 'test' };

            await skillController.getSkillDetails(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should handle parent from global Skills', async () => {
            await Skill.create({
                name: 'ParentSkill',
                categoryName: 'General',
                maxPoint: 5
            });

            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'NewSkill',
                description: 'With parent',
                categoryName: 'General',
                maxPoint: 5,
                parents: [{ name: 'ParentSkill', minPoint: 1, recommended: false }],
                children: [],
                trainings: []
            };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.skills.length).toBe(2);

            const parentInUser = user.skills.find(s => s.name === 'ParentSkill');
            expect(parentInUser).toBeDefined();
            expect(parentInUser.children[0].name).toBe('NewSkill');
            expect(parentInUser.children[0].minPoint).toBe(1);
        });

        it('should handle parent already in user skills', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.skills.push({ name: 'ExistingSkill', parents: [], children: [], trainings: [] });
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'NewSkill',
                description: 'With existing parent',
                categoryName: 'General',
                maxPoint: 5,
                parents: [{ name: 'ExistingSkill', minPoint: 2, recommended: true }],
                children: [],
                trainings: []
            };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const updatedUser = await User.findOne({ username: 'testuser' });
            expect(updatedUser.skills.length).toBe(2);

            const existingParent = updatedUser.skills.find(s => s.name === 'ExistingSkill');
            expect(existingParent.children[0].name).toBe('NewSkill');
            expect(existingParent.children[0].minPoint).toBe(2);
            expect(existingParent.children[0].recommended).toBe(true);
        });

        it('should link to approvable parent', async () => {
            await ApprovableSkill.create({
                name: 'ApprovableParent',
                username: 'otheruser'
            });

            req.decoded = { username: 'testuser' };
            req.body = {
                name: 'NewSkill',
                description: 'Linked skill',
                categoryName: 'General',
                maxPoint: 5,
                parents: [{ name: 'ApprovableParent', minPoint: 1, recommended: false }],
                children: [],
                trainings: []
            };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const apprParent = await ApprovableSkill.findOne({ name: 'ApprovableParent' });
            expect(apprParent.children.length).toBe(1);
            expect(apprParent.children[0].name).toBe('NewSkill');
        });

        it('should return error when user not found (line 133)', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            req.decoded = { username: 'nonexistent' };
            req.body = { name: 'NewSkill', parents: [] };

            await skillController.newSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
            jest.restoreAllMocks();
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { name: 'NewSkill', parents: [] };

            await skillController.newSkill(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should return error when user not found in newTraining (line 201)', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            req.decoded = { username: 'nonexistent' };
            req.body = { skillName: 'Skill1', trainings: [] };

            await skillController.newTraining(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
            jest.restoreAllMocks();
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { skillName: 'test', trainings: [] };

            await skillController.newTraining(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
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

        it('should log skill history on level-up', async () => {
            const SkillHistory = require('../../../src/models/skillhistorymodel');

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 3 }];

            await skillController.submitAll(req, res);

            const history = await SkillHistory.find({ username: 'testuser' });
            expect(history.length).toBe(1);
            expect(history[0].skillName).toBe('Skill1');
            expect(history[0].achievedPoint).toBe(3);
        });

        it('should not log skill history when achievedPoint unchanged', async () => {
            const SkillHistory = require('../../../src/models/skillhistorymodel');
            const user = await User.findOne({ username: 'testuser' });
            user.skills[0].achievedPoint = 3;
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 3 }];

            await skillController.submitAll(req, res);

            const history = await SkillHistory.find({ username: 'testuser' });
            expect(history.length).toBe(0);
        });

        it('should accept 5-factor assessment and compute effectiveLevel', async () => {
            req.decoded = { username: 'testuser' };
            req.body = [{
                name: 'Skill1',
                achievedPoint: 3,
                assessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 }
            }];

            await skillController.submitAll(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const user = await User.findOne({ username: 'testuser' });
            expect(user.skills[0].assessment).toBeDefined();
            expect(user.skills[0].assessment.autonomy).toBe(3);
            expect(user.skills[0].assessment.complexity).toBe(2);
            expect(user.skills[0].assessment.effectiveLevel).toBe(2);
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

        it('should update existing offer achievedPoint', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.willingToTeach = true;
            user.location = 'NYC';
            user.teachingDay = 'Mon';
            user.teachingTime = '10:00';
            await user.save();

            await Skill.create({
                name: 'Skill1',
                offers: [{ username: 'testuser', achievedPoint: 2, location: 'NYC', teachingDay: 'Mon', teachingTime: '10:00' }]
            });

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 5 }];

            await skillController.submitAll(req, res);

            const globalSkill = await Skill.findOne({ name: 'Skill1' });
            expect(globalSkill.offers.length).toBe(1);
            expect(globalSkill.offers[0].achievedPoint).toBe(5);
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

        it('should handle empty data array gracefully (line 232 loop)', async () => {
            req.decoded = { username: 'testuser' };
            req.body = [];

            await skillController.submitAll(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should return error when user not found in submitAll (line 232)', async () => {
            jest.spyOn(User, 'findOne').mockResolvedValue(null);
            req.decoded = { username: 'nonexistent' };
            req.body = [];

            await skillController.submitAll(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
            jest.restoreAllMocks();
        });

        it('should handle willingToTeach with no matching globalSkill (line 243 falsy)', async () => {
            const user = await User.findOne({ username: 'testuser' });
            user.willingToTeach = true;
            user.location = 'NYC';
            user.teachingDay = 'Mon';
            user.teachingTime = '10:00';
            await user.save();

            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'NonExistentGlobalSkill', achievedPoint: 3 }];

            await skillController.submitAll(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = [{ name: 'Skill1', achievedPoint: 0 }];

            await skillController.submitAll(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('listSkills', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Alpha', reusability: 'transversal', temporal: { stage: 'mature' } });
            await Skill.create({ name: 'Beta', reusability: 'cross-sectoral', temporal: { stage: 'growing' } });
        });

        it('should list all skills', async () => {
            req.query = {};
            await skillController.listSkills(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(2);
            expect(data.meta.total).toBe(2);
        });

        it('should filter by q', async () => {
            req.query = { q: 'Alp' };
            await skillController.listSkills(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe('Alpha');
        });

        it('should filter by reusability', async () => {
            req.query = { reusability: 'transversal' };
            await skillController.listSkills(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe('Alpha');
        });

        it('should filter by temporal stage', async () => {
            req.query = { stage: 'growing' };
            await skillController.listSkills(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(1);
            expect(data.data[0].name).toBe('Beta');
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'find').mockRejectedValue(new Error('DB error'));
            req.query = {};
            await skillController.listSkills(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('getSkillById', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Test', skillId: 'skilltree:skill:test', reusability: 'cross-sectoral' });
        });

        it('should get skill by name', async () => {
            req.params = { id: 'Test' };
            req.query = {};
            await skillController.getSkillById(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.name).toBe('Test');
        });

        it('should get skill by skillId', async () => {
            req.params = { id: 'skilltree:skill:test' };
            req.query = {};
            await skillController.getSkillById(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.name).toBe('Test');
        });

        it('should return 404 for unknown skill', async () => {
            req.params = { id: 'Unknown' };
            req.query = {};
            await skillController.getSkillById(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should handle server error', async () => {
            jest.spyOn(Skill, 'findOne').mockRejectedValue(new Error('DB error'));
            req.params = { id: 'Test' };
            req.query = {};
            await skillController.getSkillById(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            jest.restoreAllMocks();
        });
    });

    describe('getSkillProficiency', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Test', pointDescription: ['L1', 'L2', 'L3', 'L4', 'L5'] });
        });

        it('should return proficiency levels', async () => {
            req.params = { id: 'Test' };
            await skillController.getSkillProficiency(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(5);
            expect(data.data[0].level).toBe(1);
        });

        it('should return 404 for unknown skill', async () => {
            req.params = { id: 'Unknown' };
            await skillController.getSkillProficiency(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('getSkillProficiencyLevel', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Test', pointDescription: ['L1', 'L2', 'L3', 'L4', 'L5'] });
        });

        it('should return a single level', async () => {
            req.params = { id: 'Test', level: '3' };
            await skillController.getSkillProficiencyLevel(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.level).toBe(3);
            expect(data.data.description).toBe('L3');
        });

        it('should return 400 for invalid level', async () => {
            req.params = { id: 'Test', level: '8' };
            await skillController.getSkillProficiencyLevel(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('getSkillCrosswalks', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Test', crosswalks: { esco: 'http://esco/1', onet: '2.A' } });
        });

        it('should return crosswalks', async () => {
            req.params = { id: 'Test' };
            await skillController.getSkillCrosswalks(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.esco).toBe('http://esco/1');
        });

        it('should return empty object when no crosswalks', async () => {
            await Skill.create({ name: 'NoCross' });
            req.params = { id: 'NoCross' };
            await skillController.getSkillCrosswalks(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data).toEqual({});
        });
    });

    describe('getSkillRelationships', () => {
        beforeEach(async () => {
            await Skill.create({
                name: 'Test',
                parents: ['ParentA'],
                children: [{ name: 'ChildA', minPoint: 1, recommended: false }],
                relationships: [{ skillName: 'Related', type: 'complement' }]
            });
        });

        it('should return all relationship types', async () => {
            req.params = { id: 'Test' };
            await skillController.getSkillRelationships(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.length).toBe(3);
            expect(data.data.find(r => r.type === 'parent')).toBeDefined();
            expect(data.data.find(r => r.type === 'child')).toBeDefined();
            expect(data.data.find(r => r.type === 'complement')).toBeDefined();
        });
    });

    describe('getSkillTemporal', () => {
        beforeEach(async () => {
            await Skill.create({ name: 'Test', temporal: { stage: 'mature', demand_score: 78 } });
        });

        it('should return temporal data', async () => {
            req.params = { id: 'Test' };
            await skillController.getSkillTemporal(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.stage).toBe('mature');
            expect(data.data.demand_score).toBe(78);
        });

        it('should return default when no temporal data', async () => {
            await Skill.create({ name: 'NoTemp' });
            req.params = { id: 'NoTemp' };
            await skillController.getSkillTemporal(req, res);
            const data = res.json.mock.calls[0][0];
            expect(data.data.stage).toBe('mature');
        });
    });
});
