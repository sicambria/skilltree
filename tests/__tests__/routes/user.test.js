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

describe('Protected User Routes', () => {
    const User = require('../../../src/models/usermodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [],
            trees: []
        });
    });

    describe('GET /protected/userdata', () => {
        it('should return user data', async () => {
            const res = await request(app)
                .get('/protected/userdata')
                .set('x-access-token', validToken);

            expect(res.status).toBe(200);
            expect(res.body.username).toBe('testuser');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .get('/protected/userdata');

            expect(res.status).toBe(200);
            expect(res.text).toContain('login');
        });
    });

    describe('POST /protected/newemail', () => {
        it('should update email', async () => {
            const res = await request(app)
                .post('/protected/newemail')
                .set('x-access-token', validToken)
                .send({ email: 'updated@test.com' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /protected/newplace', () => {
        it('should update location', async () => {
            const res = await request(app)
                .post('/protected/newplace')
                .set('x-access-token', validToken)
                .send({ location: 'Paris' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
