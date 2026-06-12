const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('ApprovableSkill model', () => {
    it('should create with username and name', async () => {
        const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
        const sk = await ApprovableSkill.create({ username: 'user1', name: 'Skill1' });
        expect(sk.username).toBe('user1');
        expect(sk.name).toBe('Skill1');
    });
});
