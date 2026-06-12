const request = require('supertest');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const Category = require('../../../src/models/categorymodel');

let app;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../../src/app');
});

afterAll(async () => {
    await disconnectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('POST /registration', () => {
    it('should register a new user', async () => {
        await Category.create({ name: 'General' });
        const res = await request(app)
            .post('/registration')
            .send({ username: 'newuser', password: 'mypassword', email: 'new@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    it('should reject duplicate username', async () => {
        const res1 = await request(app)
            .post('/registration')
            .send({ username: 'dupuser', password: 'pass1', email: 'a@b.com' });
        expect(res1.body.success).toBe(true);

        const res2 = await request(app)
            .post('/registration')
            .send({ username: 'dupuser', password: 'pass2', email: 'b@c.com' });
        expect(res2.body.success).toBe(false);
    });
});

describe('POST /auth', () => {
    beforeEach(async () => {
        await Category.create({ name: 'General' });
        await request(app)
            .post('/registration')
            .send({ username: 'testuser', password: 'password123', email: 'test@test.com' });
    });

    it('should login with correct credentials', async () => {
        const res = await request(app)
            .post('/auth')
            .send({ username: 'testuser', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
        const res = await request(app)
            .post('/auth')
            .send({ username: 'testuser', password: 'wrongpassword' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Wrong password');
    });

    it('should reject non-existent user', async () => {
        const res = await request(app)
            .post('/auth')
            .send({ username: 'nonexistent', password: 'anything' });

        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('User not found');
    });
});

describe('GET /', () => {
    it('should serve login.html', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('login');
    });
});

describe('GET /user', () => {
    it('should serve chartandtree.html', async () => {
        const res = await request(app).get('/user/');
        expect(res.status).toBe(200);
        expect(res.text).toContain('chartandtree');
    });
});

describe('GET /apitest', () => {
    it('should return success', async () => {
        const res = await request(app).get('/apitest');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/nonexistentroute');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Resource not found');
    });
});
