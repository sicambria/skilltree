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

describe('Protected Goal Routes', () => {
    const User = require('../../../src/models/usermodel');
    const Goal = require('../../../src/models/goalmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [],
            trees: []
        });
    });

    describe('POST /protected/goals/create', () => {
        it('should create a goal', async () => {
            const res = await request(app)
                .post('/protected/goals/create')
                .set('x-access-token', validToken)
                .send({ title: 'Learn X', skillName: 'SkillX', targetLevel: 3 });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.goal.title).toBe('Learn X');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/goals/create')
                .send({ title: 'Goal', skillName: 'Skill' });
            expect(res.status).toBe(401);
        });
    });

    describe('GET /protected/goals', () => {
        it('should return user goals', async () => {
            await Goal.create({ username: 'testuser', title: 'My Goal', skillName: 'SkillA' });

            const res = await request(app)
                .get('/protected/goals')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/goals');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/goals/update', () => {
        it('should update own goal', async () => {
            const goal = await Goal.create({ username: 'testuser', title: 'Old', skillName: 'SkillA' });

            const res = await request(app)
                .post('/protected/goals/update')
                .set('x-access-token', validToken)
                .send({ goalId: goal._id.toString(), title: 'Updated' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.goal.title).toBe('Updated');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/goals/update')
                .send({ goalId: new mongoose.Types.ObjectId().toString(), title: 'Updated' });
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/goals/share', () => {
        it('should share goal with recipient', async () => {
            await User.create({
                username: 'recipient',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            const goal = await Goal.create({ username: 'testuser', title: 'Shared', skillName: 'SkillA' });

            const res = await request(app)
                .post('/protected/goals/share')
                .set('x-access-token', validToken)
                .send({ goalId: goal._id.toString(), recipientUsername: 'recipient' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.goal.collaborators).toContain('recipient');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/goals/share')
                .send({ goalId: new mongoose.Types.ObjectId().toString(), recipientUsername: 'test' });
            expect(res.status).toBe(401);
        });
    });
});
