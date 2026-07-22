const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Goal = require('../../../src/models/goalmodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('goalController', () => {
    let goalController;
    let req, res;

    beforeEach(() => {
        goalController = require('../../../src/controllers/goalController');
        req = { body: {}, decoded: { username: 'testuser' } };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('createGoal', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should create a goal', async () => {
            req.body = {
                title: 'Learn JS',
                skillName: 'JavaScript',
                targetLevel: 4,
                targetDate: '2027-01-01',
                notes: 'Study daily'
            };

            await goalController.createGoal(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.goal.title).toBe('Learn JS');
            expect(data.goal.skillName).toBe('JavaScript');
            expect(data.goal.targetLevel).toBe(4);

            const goal = await Goal.findOne({ username: 'testuser' });
            expect(goal).not.toBeNull();
            expect(goal.title).toBe('Learn JS');
        });

        it('should create goal with collaborators', async () => {
            req.body = {
                title: 'Study Group',
                skillName: 'Python',
                targetLevel: 3,
                collaborators: ['buddy1', 'buddy2']
            };

            await goalController.createGoal(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.goal.collaborators).toEqual(['buddy1', 'buddy2']);
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { title: 'Goal', skillName: 'Skill' };

            await goalController.createGoal(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { title: 'Goal', skillName: 'Skill' };

            await goalController.createGoal(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getMyGoals', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            await Goal.create({ username: 'testuser', title: 'My Goal', skillName: 'SkillA' });
            await Goal.create({ username: 'other', title: 'Collab Goal', skillName: 'SkillB', collaborators: ['testuser'] });
            await Goal.create({ username: 'other', title: 'Other Goal', skillName: 'SkillC' });
        });

        it('should return owned and collaborated goals', async () => {
            await goalController.getMyGoals(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(2);
            const titles = data.map(g => g.title);
            expect(titles).toContain('My Goal');
            expect(titles).toContain('Collab Goal');
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };

            await goalController.getMyGoals(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            const mockSort = jest.fn().mockRejectedValue(new Error('DB error'));
            jest.spyOn(Goal, 'find').mockReturnValue({ sort: mockSort });

            await goalController.getMyGoals(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('updateGoal', () => {
        let goal;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            goal = await Goal.create({ username: 'testuser', title: 'Original', skillName: 'SkillA', targetLevel: 2 });
        });

        it('should update goal fields', async () => {
            req.body = {
                goalId: goal._id.toString(),
                title: 'Updated',
                targetLevel: 5,
                notes: 'New notes'
            };

            await goalController.updateGoal(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.goal.title).toBe('Updated');
            expect(data.goal.targetLevel).toBe(5);

            const updated = await Goal.findById(goal._id);
            expect(updated.title).toBe('Updated');
            expect(updated.targetLevel).toBe(5);
            expect(updated.notes).toBe('New notes');
        });

        it('should reject update by non-owner', async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'otheruser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            req.decoded = { username: 'otheruser' };
            req.body = { goalId: goal._id.toString(), title: 'Hacked' };

            await goalController.updateGoal(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized.'
            });
        });

        it('should return error when goal not found', async () => {
            req.body = { goalId: new mongoose.Types.ObjectId().toString(), title: 'Updated' };

            await goalController.updateGoal(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Goal not found.'
            });
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { goalId: goal._id.toString(), title: 'Updated' };

            await goalController.updateGoal(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(Goal, 'findById').mockRejectedValue(new Error('DB error'));
            req.body = { goalId: goal._id.toString(), title: 'Updated' };

            await goalController.updateGoal(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('shareTimeline', () => {
        let goal;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            await User.create({
                username: 'recipient',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            goal = await Goal.create({ username: 'testuser', title: 'Shared Goal', skillName: 'SkillA' });
        });

        it('should add collaborator to goal', async () => {
            req.body = { goalId: goal._id.toString(), recipientUsername: 'recipient' };

            await goalController.shareTimeline(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.goal.collaborators).toContain('recipient');
        });

        it('should reject if already a collaborator', async () => {
            goal.collaborators.push('recipient');
            await goal.save();

            req.body = { goalId: goal._id.toString(), recipientUsername: 'recipient' };

            await goalController.shareTimeline(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Already a collaborator.'
            });
        });

        it('should return error when recipient not found', async () => {
            req.body = { goalId: goal._id.toString(), recipientUsername: 'nonexistent' };

            await goalController.shareTimeline(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Recipient not found.'
            });
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { goalId: goal._id.toString(), recipientUsername: 'recipient' };

            await goalController.shareTimeline(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should return error when goal not found', async () => {
            req.body = { goalId: new mongoose.Types.ObjectId().toString(), recipientUsername: 'recipient' };

            await goalController.shareTimeline(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Goal not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(Goal, 'findById').mockRejectedValue(new Error('DB error'));
            req.body = { goalId: goal._id.toString(), recipientUsername: 'recipient' };

            await goalController.shareTimeline(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
