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
            skillId: 'skilltree:skill:react',
            categoryName: 'Frontend',
            skillIcon: 'icon.png',
            description: 'A library',
            descriptionWikipediaURL: 'http://wikipedia.org/React',
            pointDescription: ['Novice', 'Expert'],
            achievedPoint: 3,
            maxPoint: 5,
            reusability: 'cross-sectoral',
            parents: ['JavaScript'],
            children: [{ name: 'ReactNative', minPoint: 3, recommended: true }],
            relationships: [{ skillName: 'JavaScript', type: 'prerequisite' }],
            crosswalks: { esco: 'http://esco/123', onet: '2.A.1.e' },
            temporal: { stage: 'mature', demand_score: 78 },
            trainings: [{ name: 'Course', level: 1, shortDescription: 'Intro', URL: 'http://example.com', goal: 'Learn', length: 10, language: 'en' }],
            offers: [{ username: 'user1', teachingDay: 'Mon', teachingTime: '10:00', location: 'NYC', achievedPoint: 3 }],
            beginnerRequests: [{ username: 'user2', achievedPoint: 1, email: 'a@b.com' }],
            intermediateRequests: [],
            advancedRequests: []
        });
        expect(skill.name).toBe('React');
        expect(skill.skillId).toBe('skilltree:skill:react');
        expect(skill.reusability).toBe('cross-sectoral');
        expect(skill.parents).toEqual(['JavaScript']);
        expect(skill.children.length).toBe(1);
        expect(skill.children[0].name).toBe('ReactNative');
        expect(skill.relationships.length).toBe(1);
        expect(skill.relationships[0].type).toBe('prerequisite');
        expect(skill.crosswalks.esco).toBe('http://esco/123');
        expect(skill.temporal.stage).toBe('mature');
        expect(skill.trainings.length).toBe(1);
        expect(skill.offers.length).toBe(1);
        expect(skill.beginnerRequests.length).toBe(1);
    });

    it('should enforce valid reusability enum', async () => {
        const Skill = require('../../../src/models/skillmodel');
        const skill = new Skill({ name: 'Test', reusability: 'invalid' });
        const err = skill.validateSync();
        expect(err.errors['reusability']).toBeDefined();
    });

    it('should enforce valid relationship type enum', async () => {
        const Skill = require('../../../src/models/skillmodel');
        const skill = new Skill({ name: 'Test', relationships: [{ skillName: 'X', type: 'invalid' }] });
        const err = skill.validateSync();
        expect(err.errors['relationships.0.type']).toBeDefined();
    });

    it('should reject invalid temporal stage enum', async () => {
        const Skill = require('../../../src/models/skillmodel');
        const skill = new Skill({ name: 'Test', temporal: { stage: 'unknown' } });
        const err = skill.validateSync();
        expect(err).not.toBeNull();
        expect(err.errors['temporal.stage']).toBeDefined();
    });

    it('should find skill by name', async () => {
        const Skill = require('../../../src/models/skillmodel');
        await Skill.create({ name: 'Node.js' });
        const found = await Skill.findOne({ name: 'Node.js' });
        expect(found).not.toBeNull();
    });
});
