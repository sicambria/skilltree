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

    it('should accept framework fields', async () => {
        const ApprovableSkill = require('../../../src/models/skillsforapprovemodel');
        const sk = await ApprovableSkill.create({
            username: 'user1',
            name: 'Skill1',
            skillId: 'skilltree:skill:skill1',
            reusability: 'transversal',
            relationships: [{ skillName: 'Other', type: 'prerequisite' }],
            crosswalks: { esco: 'http://esco/1' },
            temporal: { stage: 'emerging', demand_score: 50 }
        });
        expect(sk.reusability).toBe('transversal');
        expect(sk.skillId).toBe('skilltree:skill:skill1');
        expect(sk.relationships.length).toBe(1);
        expect(sk.relationships[0].type).toBe('prerequisite');
        expect(sk.crosswalks.esco).toBe('http://esco/1');
    });
});
