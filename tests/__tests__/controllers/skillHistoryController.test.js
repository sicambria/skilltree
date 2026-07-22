const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const SkillHistory = require('../../../src/models/skillhistorymodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('skillHistoryController', () => {
    let skillHistoryController;
    let req, res;

    beforeEach(() => {
        skillHistoryController = require('../../../src/controllers/skillHistoryController');
        req = { query: {}, body: {}, decoded: { username: 'testuser' } };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getSkillHistory', () => {
        beforeEach(async () => {
            await SkillHistory.create({ username: 'testuser', skillName: 'SkillA', achievedPoint: 1 });
            await SkillHistory.create({ username: 'testuser', skillName: 'SkillA', achievedPoint: 2 });
            await SkillHistory.create({ username: 'testuser', skillName: 'SkillB', achievedPoint: 1 });
        });

        it('should return history for a specific skill', async () => {
            req.query = { skill: 'SkillA' };

            await skillHistoryController.getSkillHistory(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(2);
            expect(data[0].skillName).toBe('SkillA');
        });

        it('should return all history when no skill query', async () => {
            await skillHistoryController.getSkillHistory(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(3);
        });

        it('should return empty array when no history found', async () => {
            req.query = { skill: 'NonExistent' };

            await skillHistoryController.getSkillHistory(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data).toEqual([]);
        });

        it('should handle server error', async () => {
            const mockSort = jest.fn().mockRejectedValue(new Error('DB error'));
            jest.spyOn(SkillHistory, 'find').mockReturnValue({ sort: mockSort });

            await skillHistoryController.getSkillHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('getAllHistory', () => {
        beforeEach(async () => {
            await SkillHistory.create({ username: 'testuser', skillName: 'SkillA', achievedPoint: 1 });
            await SkillHistory.create({ username: 'otheruser', skillName: 'SkillB', achievedPoint: 2 });
        });

        it('should return all history for the logged-in user', async () => {
            await skillHistoryController.getAllHistory(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(1);
            expect(data[0].skillName).toBe('SkillA');
        });

        it('should handle server error', async () => {
            const mockSort = jest.fn().mockRejectedValue(new Error('DB error'));
            jest.spyOn(SkillHistory, 'find').mockReturnValue({ sort: mockSort });

            await skillHistoryController.getAllHistory(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
