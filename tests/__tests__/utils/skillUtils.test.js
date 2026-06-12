const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const Skill = require('../../../src/models/skillmodel');
const { findSkillByName } = require('../../../src/utils/skillUtils');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('skillUtils.js', () => {
    describe('findSkillByName', () => {
        it('should return skill when found', async () => {
            await Skill.create({ name: 'JavaScript', categoryName: 'Programming' });
            const skill = await findSkillByName('JavaScript');
            expect(skill).not.toBeNull();
            expect(skill.name).toBe('JavaScript');
            expect(skill.categoryName).toBe('Programming');
        });

        it('should return null when skill not found', async () => {
            const skill = await findSkillByName('NonExistentSkill');
            expect(skill).toBeNull();
        });

        it('should return null for empty string name', async () => {
            const skill = await findSkillByName('');
            expect(skill).toBeNull();
        });

        it('should return null for undefined name', async () => {
            const skill = await findSkillByName(undefined);
            expect(skill).toBeNull();
        });

        it('should be case-sensitive', async () => {
            await Skill.create({ name: 'Python' });
            const skill = await findSkillByName('python');
            expect(skill).toBeNull();
        });

        it('should find among multiple skills', async () => {
            await Skill.create({ name: 'A' });
            await Skill.create({ name: 'B' });
            await Skill.create({ name: 'C' });
            const skill = await findSkillByName('B');
            expect(skill).not.toBeNull();
            expect(skill.name).toBe('B');
        });

        it('should return full skill document', async () => {
            const doc = await Skill.create({
                name: 'React',
                categoryName: 'Frontend',
                description: 'A JS library',
                maxPoint: 5,
                parents: ['JavaScript'],
                children: [{ name: 'ReactNative', minPoint: 3, recommended: true }],
                trainings: [{ name: 'React Course', level: 1, shortDescription: 'Intro', URL: 'http://example.com', goal: 'Learn', length: 10, language: 'en' }],
                offers: [{ username: 'user1', teachingDay: 'Mon', teachingTime: '10:00', location: 'NYC', achievedPoint: 3 }],
                beginnerRequests: [{ username: 'user2', achievedPoint: 1, email: 'a@b.com' }],
                intermediateRequests: [],
                advancedRequests: []
            });
            const skill = await findSkillByName('React');
            expect(skill.description).toBe('A JS library');
            expect(skill.parents).toEqual(['JavaScript']);
            expect(skill.children.length).toBe(1);
            expect(skill.trainings.length).toBe(1);
            expect(skill.offers.length).toBe(1);
            expect(skill.beginnerRequests.length).toBe(1);
        });
    });
});
