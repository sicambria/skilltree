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

    describe('GET /protected/skillsforapproval', () => {
        it('should get skills for approval', async () => {
            const res = await request(app)
                .get('/protected/skillsforapproval')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
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

    describe('POST /protected/searchUserSkillsByName', () => {
        it('should search user skills by name', async () => {
            const res = await request(app)
                .post('/protected/searchUserSkillsByName')
                .set('x-access-token', validToken)
                .send({ value: 'My' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it('should return empty for non-matching', async () => {
            const res = await request(app)
                .post('/protected/searchUserSkillsByName')
                .set('x-access-token', validToken)
                .send({ value: 'XYZ' });
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(0);
        });
    });

    describe('POST /protected/getPublicSkillData', () => {
        it('should get public skill data', async () => {
            const res = await request(app)
                .post('/protected/getPublicSkillData')
                .set('x-access-token', validToken)
                .send({ value: 'Skill' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('POST /protected/getskill', () => {
        it('should get skill details from global skills', async () => {
            const res = await request(app)
                .post('/protected/getskill')
                .set('x-access-token', validToken)
                .send({ value: 'GlobalSkill' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should get skill details from user skills', async () => {
            const res = await request(app)
                .post('/protected/getskill')
                .set('x-access-token', validToken)
                .send({ value: 'MySkill' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return failure for unknown skill', async () => {
            const res = await request(app)
                .post('/protected/getskill')
                .set('x-access-token', validToken)
                .send({ value: 'NonExistent' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
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

    describe('POST /protected/newtraining', () => {
        it('should add training to existing skill', async () => {
            const res = await request(app)
                .post('/protected/newtraining')
                .set('x-access-token', validToken)
                .send({
                    skillName: 'MySkill',
                    trainings: [{ name: 'Training1', level: 1, shortDescription: 'Desc', URL: 'http://example.com' }]
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return error for non-existent skill', async () => {
            const res = await request(app)
                .post('/protected/newtraining')
                .set('x-access-token', validToken)
                .send({
                    skillName: 'NonExistent',
                    trainings: [{ name: 'T1' }]
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
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
