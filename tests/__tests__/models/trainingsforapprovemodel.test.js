const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('ApprovableTraining model', () => {
    it('should create with username and skillName', async () => {
        const ApprovableTraining = require('../../../src/models/trainingsforapprovemodel');
        const tr = await ApprovableTraining.create({ username: 'user1', skillName: 'Skill1', name: 'Training1' });
        expect(tr.username).toBe('user1');
        expect(tr.skillName).toBe('Skill1');
        expect(tr.name).toBe('Training1');
    });
});
