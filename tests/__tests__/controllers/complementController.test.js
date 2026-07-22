const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Skill = require('../../../src/models/skillmodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('complementController', () => {
    let complementController;
    let req, res;

    beforeEach(() => {
        complementController = require('../../../src/controllers/complementController');
        req = { body: {}, decoded: { username: 'testuser' } };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getComplementaryUsers', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await Skill.create({
                name: 'SkillA',
                relationships: [{ skillName: 'SkillB', type: 'complement' }]
            });
            await Skill.create({
                name: 'SkillB',
                relationships: [{ skillName: 'SkillA', type: 'complement' }]
            });
            await Skill.create({
                name: 'SkillC',
                relationships: [{ skillName: 'SkillA', type: 'prerequisite' }]
            });
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillA', achievedPoint: 3, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'complementor',
                hashData: security.hashPassword('pw'),
                willingToTeach: true,
                location: 'NYC',
                skills: [
                    { name: 'SkillA', achievedPoint: 2, parents: [], children: [], trainings: [] },
                    { name: 'SkillB', achievedPoint: 4, parents: [], children: [], trainings: [] }
                ],
                trees: []
            });
            await User.create({
                username: 'identical',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] }],
                trees: []
            });
        });

        it('should find complementary users with typed gaps', async () => {
            await complementController.getComplementaryUsers(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBeGreaterThanOrEqual(1);
            const compUser = data.find(d => d.username === 'complementor');
            expect(compUser).toBeDefined();
            expect(compUser.gaps.length).toBeGreaterThanOrEqual(1);
            expect(compUser.gaps[0].type).toBe('complement');
            expect(compUser.gaps[0].skillName).toBe('SkillB');
        });

        it('should return empty gaps for users with identical skills', async () => {
            await complementController.getComplementaryUsers(req, res);

            const data = res.json.mock.calls[0][0];
            const identicalUser = data.find(d => d.username === 'identical');
            expect(identicalUser).toBeDefined();
            expect(identicalUser.gaps.length).toBe(0);
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };

            await complementController.getComplementaryUsers(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));

            await complementController.getComplementaryUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getGroupCoverage', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await Skill.create({ name: 'SkillA' });
            await Skill.create({ name: 'SkillB' });
            await Skill.create({ name: 'SkillC' });
            await User.create({
                username: 'user1',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] }],
                trees: []
            });
            await User.create({
                username: 'user2',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillB', achievedPoint: 2, parents: [], children: [], trainings: [] }],
                trees: []
            });
        });

        it('should return group coverage and gaps', async () => {
            req.body = { usernames: ['user1', 'user2'] };

            await complementController.getGroupCoverage(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.coverage.length).toBe(2);
            expect(data.gaps.length).toBeGreaterThanOrEqual(1);
            const gapNames = data.gaps.map(g => g.skillName);
            expect(gapNames).toContain('SkillC');
        });

        it('should return error for missing usernames', async () => {
            req.body = {};

            await complementController.getGroupCoverage(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Usernames array required.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'find').mockRejectedValue(new Error('DB error'));
            req.body = { usernames: ['user1'] };

            await complementController.getGroupCoverage(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
