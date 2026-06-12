const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const jwt = require('jsonwebtoken');

let app;
let adminToken;
let userToken;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../../src/app');
    adminToken = jwt.sign({ username: 'admin', admin: true }, 'verysecret', { expiresIn: '1d' });
    userToken = jwt.sign({ username: 'user', admin: false }, 'verysecret', { expiresIn: '1d' });
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('Admin Routes', () => {
    const User = require('../../../src/models/usermodel');

    describe('GET /admin/testAdmin', () => {
        it('should allow admin access', async () => {
            const res = await request(app)
                .get('/admin/testAdmin')
                .set('x-access-token', adminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should deny non-admin access', async () => {
            const res = await request(app)
                .get('/admin/testAdmin')
                .set('x-access-token', userToken);

            expect(res.status).toBe(403);
        });

        it('should deny without token', async () => {
            const res = await request(app)
                .get('/admin/testAdmin');

            expect(res.status).toBe(403);
        });
    });

    describe('POST /admin/deleteUser', () => {
        it('should allow admin to delete user', async () => {
            await User.create({ username: 'todelete' });
            const res = await request(app)
                .post('/admin/deleteUser')
                .set('x-access-token', adminToken)
                .send({ username: 'todelete' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /admin/setadmin', () => {
        it('should allow admin to set admin status', async () => {
            await User.create({ username: 'target' });
            const res = await request(app)
                .post('/admin/setadmin')
                .set('x-access-token', adminToken)
                .send({ username: 'target', give: true });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
