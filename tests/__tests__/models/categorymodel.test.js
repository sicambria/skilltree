const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('Category model', () => {
    it('should create a category with name', async () => {
        const Category = require('../../../src/models/categorymodel');
        const cat = await Category.create({ name: 'Programming' });
        expect(cat.name).toBe('Programming');
        expect(cat._id).toBeDefined();
    });

    it('should create a category without name', async () => {
        const Category = require('../../../src/models/categorymodel');
        const cat = await Category.create({});
        expect(cat.name).toBeUndefined();
    });

    it('should find all categories', async () => {
        const Category = require('../../../src/models/categorymodel');
        await Category.create({ name: 'A' });
        await Category.create({ name: 'B' });
        const cats = await Category.find({});
        expect(cats.length).toBe(2);
    });
});
