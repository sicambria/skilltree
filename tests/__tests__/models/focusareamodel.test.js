const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('FocusArea model', () => {
    it('should create with name', async () => {
        const FocusArea = require('../../../src/models/focusareamodel');
        const fa = await FocusArea.create({ name: 'Development' });
        expect(fa.name).toBe('Development');
    });
});
