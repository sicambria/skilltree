const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const jwt = require('jsonwebtoken');

let app;
let validToken;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../../src/app');
    validToken = jwt.sign({ username: 'testuser' }, 'verysecret', { expiresIn: '1d' });
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('Protected Complement Routes', () => {
    const User = require('../../../src/models/usermodel');
    const Skill = require('../../../src/models/skillmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await Skill.create({
            name: 'SkillA',
            relationships: [{ skillName: 'SkillB', type: 'complement' }]
        });
        await Skill.create({
            name: 'SkillB',
            relationships: [{ skillName: 'SkillA', type: 'complement' }]
        });
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [{ name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] }],
            trees: []
        });
        await User.create({
            username: 'other',
            hashData: security.hashPassword('pw'),
            skills: [
                { name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] },
                { name: 'SkillB', achievedPoint: 3, parents: [], children: [], trainings: [] }
            ],
            trees: []
        });
    });

    describe('POST /protected/complement/people', () => {
        it('should return complementary users', async () => {
            const res = await request(app)
                .post('/protected/complement/people')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/complement/people');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/complement/group', () => {
        it('should return group coverage', async () => {
            const res = await request(app)
                .post('/protected/complement/group')
                .set('x-access-token', validToken)
                .send({ usernames: ['testuser', 'other'] });
            expect(res.status).toBe(200);
            expect(res.body.coverage).toBeDefined();
            expect(res.body.gaps).toBeDefined();
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/complement/group')
                .send({ usernames: ['testuser'] });
            expect(res.status).toBe(401);
        });
    });
});
