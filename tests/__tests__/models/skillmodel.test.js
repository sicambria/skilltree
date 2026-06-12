const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('Skill model', () => {
    it('should create a minimal skill', async () => {
        const Skill = require('../../../src/models/skillmodel');
        const skill = await Skill.create({ name: 'JavaScript' });
        expect(skill.name).toBe('JavaScript');
    });

    it('should create a skill with all fields', async () => {
        const Skill = require('../../../src/models/skillmodel');
        const skill = await Skill.create({
            name: 'React',
            categoryName: 'Frontend',
            skillIcon: 'icon.png',
            description: 'A library',
            descriptionWikipediaURL: 'http://wikipedia.org/React',
            pointDescription: ['Novice', 'Expert'],
            achievedPoint: 3,
            maxPoint: 5,
            parents: ['JavaScript'],
            children: [{ name: 'ReactNative', minPoint: 3, recommended: true }],
            trainings: [{ name: 'Course', level: 1, shortDescription: 'Intro', URL: 'http://example.com', goal: 'Learn', length: 10, language: 'en' }],
            offers: [{ username: 'user1', teachingDay: 'Mon', teachingTime: '10:00', location: 'NYC', achievedPoint: 3 }],
            beginnerRequests: [{ username: 'user2', achievedPoint: 1, email: 'a@b.com' }],
            intermediateRequests: [],
            advancedRequests: []
        });
        expect(skill.name).toBe('React');
        expect(skill.parents).toEqual(['JavaScript']);
        expect(skill.children.length).toBe(1);
        expect(skill.children[0].name).toBe('ReactNative');
        expect(skill.trainings.length).toBe(1);
        expect(skill.offers.length).toBe(1);
        expect(skill.beginnerRequests.length).toBe(1);
    });

    it('should find skill by name', async () => {
        const Skill = require('../../../src/models/skillmodel');
        await Skill.create({ name: 'Node.js' });
        const found = await Skill.findOne({ name: 'Node.js' });
        expect(found).not.toBeNull();
    });
});
