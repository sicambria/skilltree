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

describe('Protected Skill Routes', () => {
    const User = require('../../../src/models/usermodel');
    const Skill = require('../../../src/models/skillmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [{ name: 'MySkill', parents: [], children: [], trainings: [] }]
        });
        await Skill.create({ name: 'GlobalSkill', offers: [] });
    });

    describe('POST /protected/offers', () => {
        it('should get offers for a skill', async () => {
            const res = await request(app)
                .post('/protected/offers')
                .set('x-access-token', validToken)
                .send({ name: 'GlobalSkill' });

            expect(res.status).toBe(200);
            expect(res.body.name).toBe('GlobalSkill');
        });
    });

    describe('POST /protected/searchSkillsByName', () => {
        it('should search skills', async () => {
            const res = await request(app)
                .post('/protected/searchSkillsByName')
                .set('x-access-token', validToken)
                .send({ value: 'Skill' });

            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('POST /protected/newskill', () => {
        it('should create a new skill', async () => {
            const res = await request(app)
                .post('/protected/newskill')
                .set('x-access-token', validToken)
                .send({
                    name: 'BrandNewSkill',
                    description: 'A brand new skill',
                    categoryName: 'General',
                    maxPoint: 5,
                    parents: [],
                    children: [],
                    trainings: []
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /protected/submitall', () => {
        it('should submit all skill updates', async () => {
            const res = await request(app)
                .post('/protected/submitall')
                .set('x-access-token', validToken)
                .send([{ name: 'MySkill', achievedPoint: 4 }]);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
