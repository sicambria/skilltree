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

describe('Protected Recommend Routes', () => {
    const User = require('../../../src/models/usermodel');
    const Goal = require('../../../src/models/goalmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            willingToTeach: false,
            skills: [{ name: 'SkillA', achievedPoint: 1, parents: [], children: [], trainings: [] }],
            trees: []
        });
    });

    describe('GET /protected/recommend/next', () => {
        it('should return recommendations', async () => {
            await Goal.create({ username: 'testuser', title: 'Goal', skillName: 'SkillA', targetLevel: 3 });

            const res = await request(app)
                .get('/protected/recommend/next')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(res.body.mentors).toBeDefined();
            expect(res.body.paths).toBeDefined();
            expect(res.body.trainings).toBeDefined();
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/recommend/next');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /protected/recommend/mentors', () => {
        it('should return mentors for a skill', async () => {
            await User.create({
                username: 'mentor',
                hashData: security.hashPassword('pw'),
                willingToTeach: true,
                skills: [{ name: 'NodeJS', achievedPoint: 4, parents: [], children: [], trainings: [] }],
                trees: []
            });

            const res = await request(app)
                .get('/protected/recommend/mentors?skill=NodeJS')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/recommend/mentors?skill=NodeJS');
            expect(res.status).toBe(401);
        });
    });
});
