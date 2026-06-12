const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('Tree model', () => {
    it('should create a tree with all fields', async () => {
        const Tree = require('../../../src/models/treemodel');
        const tree = await Tree.create({
            name: 'Web Dev',
            description: 'Become a web developer',
            skillNames: ['HTML', 'CSS', 'JS'],
            focusArea: 'Development'
        });
        expect(tree.name).toBe('Web Dev');
        expect(tree.skillNames).toEqual(['HTML', 'CSS', 'JS']);
        expect(tree.focusArea).toBe('Development');
    });

    it('should create a minimal tree', async () => {
        const Tree = require('../../../src/models/treemodel');
        const tree = await Tree.create({ name: 'Minimal' });
        expect(tree.name).toBe('Minimal');
    });

    it('should find tree by name', async () => {
        const Tree = require('../../../src/models/treemodel');
        await Tree.create({ name: 'Data Science' });
        const found = await Tree.findOne({ name: 'Data Science' });
        expect(found).not.toBeNull();
    });
});
