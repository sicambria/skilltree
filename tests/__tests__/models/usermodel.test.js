const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('User model', () => {
    it('should create a minimal user', async () => {
        const User = require('../../../src/models/usermodel');
        const user = await User.create({ username: 'testuser' });
        expect(user.username).toBe('testuser');
    });

    it('should create user with all fields', async () => {
        const User = require('../../../src/models/usermodel');
        const user = await User.create({
            username: 'admin',
            admin: true,
            email: 'admin@test.com',
            hashData: Buffer.from('somehash'),
            focusArea: { name: 'Dev', treeNames: ['Tree1'] },
            location: 'NYC',
            willingToTeach: true,
            teachingDay: 'Mon',
            teachingTime: '10:00',
            categories: [{ name: 'Programming', achievedPoint: 5, maxPoint: 10 }],
            skills: [{
                name: 'JS',
                categoryName: 'Programming',
                achievedPoint: 3,
                maxPoint: 5,
                parents: [],
                children: [],
                trainings: [],
                endorsement: ['user2']
            }],
            mainTree: 'Web Dev',
            trees: [{ name: 'Web Dev', skillNames: ['JS'], description: 'Desc', focusArea: 'Dev' }]
        });
        expect(user.admin).toBe(true);
        expect(user.skills.length).toBe(1);
        expect(user.skills[0].endorsement).toEqual(['user2']);
        expect(user.trees.length).toBe(1);
    });

    it('should find user by username', async () => {
        const User = require('../../../src/models/usermodel');
        await User.create({ username: 'johndoe' });
        const found = await User.findOne({ username: 'johndoe' });
        expect(found).not.toBeNull();
    });
});
