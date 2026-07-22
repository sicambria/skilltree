const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');
const Tree = require('../../../src/models/treemodel');
const Goal = require('../../../src/models/goalmodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('recommendController', () => {
    let recommendController;
    let req, res;

    beforeEach(() => {
        recommendController = require('../../../src/controllers/recommendController');
        req = { query: {}, body: {}, decoded: { username: 'testuser' } };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getNextSteps', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                willingToTeach: false,
                skills: [{ name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'mentor1',
                hashData: security.hashPassword('pw'),
                willingToTeach: true,
                location: 'NYC',
                teachingDay: 'Mon',
                teachingTime: '10:00',
                skills: [{ name: 'SkillB', achievedPoint: 4, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'mentor2',
                hashData: security.hashPassword('pw'),
                willingToTeach: false,
                skills: [{ name: 'SkillB', achievedPoint: 5, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await Skill.create({ name: 'SkillB', offers: [{ username: 'trainer1', teachingDay: 'Tue' }] });
            await Tree.create({ name: 'TreeX', skillNames: ['SkillB'] });
        });

        it('should return recommendations based on goals', async () => {
            await Goal.create({ username: 'testuser', title: 'Learn B', skillName: 'SkillB', targetLevel: 3 });

            await recommendController.getNextSteps(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.mentors.length).toBeGreaterThanOrEqual(1);
            expect(data.paths.length).toBeGreaterThanOrEqual(1);
            expect(data.trainings.length).toBeGreaterThanOrEqual(1);
            const mentorUsernames = data.mentors.map(m => m.username);
            expect(mentorUsernames).toContain('mentor1');
            expect(mentorUsernames).not.toContain('mentor2');
        });

        it('should return empty when no goals set', async () => {
            await recommendController.getNextSteps(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.mentors).toEqual([]);
            expect(data.paths).toEqual([]);
            expect(data.trainings).toEqual([]);
        });

        it('should skip goals already at target level', async () => {
            await Goal.create({ username: 'testuser', title: 'Know A', skillName: 'SkillA', targetLevel: 1 });

            await recommendController.getNextSteps(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.mentors).toEqual([]);
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };

            await recommendController.getNextSteps(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));

            await recommendController.getNextSteps(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getMentorsForSkill', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'mentor1',
                hashData: security.hashPassword('pw'),
                willingToTeach: true,
                location: 'SF',
                teachingDay: 'Wed',
                skills: [{ name: 'React', achievedPoint: 4, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'mentor2',
                hashData: security.hashPassword('pw'),
                willingToTeach: true,
                skills: [{ name: 'React', achievedPoint: 3, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'nonmentor',
                hashData: security.hashPassword('pw'),
                willingToTeach: false,
                skills: [{ name: 'React', achievedPoint: 5, parents: [], children: [], trainings: [] }],
                trees: []
            });
        });

        it('should return mentors for a skill', async () => {
            req.query = { skill: 'React' };

            await recommendController.getMentorsForSkill(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(2);
            expect(data[0].skillName).toBe('React');
            expect(data[0].achievedPoint).toBe(4);
        });

        it('should exclude non-willing users', async () => {
            req.query = { skill: 'React' };

            await recommendController.getMentorsForSkill(req, res);

            const data = res.json.mock.calls[0][0];
            const usernames = data.map(m => m.username);
            expect(usernames).not.toContain('nonmentor');
        });

        it('should return empty array when no mentors found', async () => {
            req.query = { skill: 'NonExistent' };

            await recommendController.getMentorsForSkill(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data).toEqual([]);
        });

        it('should return error when no skill query', async () => {
            await recommendController.getMentorsForSkill(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Skill query parameter required.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'find').mockRejectedValue(new Error('DB error'));
            req.query = { skill: 'React' };

            await recommendController.getMentorsForSkill(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
