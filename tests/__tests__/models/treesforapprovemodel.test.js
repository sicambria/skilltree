const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('ApprovableTree model', () => {
    it('should create with name and username', async () => {
        const ApprovableTree = require('../../../src/models/treesforapprovemodel');
        const tr = await ApprovableTree.create({ name: 'Tree1', username: 'user1' });
        expect(tr.name).toBe('Tree1');
        expect(tr.username).toBe('user1');
    });
});
