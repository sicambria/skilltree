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

describe('Protected Plan Routes', () => {
    const User = require('../../../src/models/usermodel');
    const LearningPlan = require('../../../src/models/learningplanmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [],
            trees: []
        });
    });

    describe('POST /protected/plan', () => {
        it('should create a plan', async () => {
            const res = await request(app)
                .post('/protected/plan')
                .set('x-access-token', validToken)
                .send({ title: 'My Plan' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.plan.title).toBe('My Plan');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/plan');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /protected/plan', () => {
        it('should return the plan', async () => {
            await LearningPlan.create({ username: 'testuser', title: 'Test', horizons: {} });

            const res = await request(app)
                .get('/protected/plan')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Test');
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/plan');
            expect(res.status).toBe(401);
        });
    });

    describe('PATCH /protected/plan/horizon/:horizon', () => {
        it('should update horizon', async () => {
            await LearningPlan.create({ username: 'testuser', title: 'Plan', horizons: { shortTerm: { skills: [] }, midTerm: { skills: [] }, longTerm: { skills: [] } } });

            const res = await request(app)
                .patch('/protected/plan/horizon/shortTerm')
                .set('x-access-token', validToken)
                .send({ skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } }] });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.plan.horizons.shortTerm.skills.length).toBe(1);
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .patch('/protected/plan/horizon/shortTerm');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/plan/classify/:horizon', () => {
        it('should classify transition type', async () => {
            await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {
                    shortTerm: { targetDate: new Date(), skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } }] },
                    midTerm: { skills: [] },
                    longTerm: { skills: [] }
                }
            });

            const res = await request(app)
                .post('/protected/plan/classify/shortTerm')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.transitionType).toBe('broaden');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/plan/classify/shortTerm');
            expect(res.status).toBe(401);
        });
    });

    describe('GET /protected/plan/progress', () => {
        it('should return progress', async () => {
            await LearningPlan.create({
                username: 'testuser',
                title: 'Plan',
                horizons: {
                    shortTerm: { targetDate: new Date(), skills: [{ skillName: 'SkillA', targetAssessment: { autonomy: 3, complexity: 2, influence: 2, knowledge: 3, business_skills: 2 } }] },
                    midTerm: { skills: [] },
                    longTerm: { skills: [] }
                }
            });

            const res = await request(app)
                .get('/protected/plan/progress')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(res.body.username).toBe('testuser');
            expect(res.body.progress).toBeDefined();
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/plan/progress');
            expect(res.status).toBe(401);
        });
    });
});
