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
            const res = await request(app).get('/protected/userdata');
            expect(res.status).toBe(401);
            expect(res.body).toEqual({ success: false, message: 'No token provided.' });
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

    describe('POST /protected/searchUsersByName', () => {
        it('should search users by name', async () => {
            const res = await request(app)
                .post('/protected/searchUsersByName')
                .set('x-access-token', validToken)
                .send({ value: 'test' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('POST /protected/getPublicUserData', () => {
        it('should get public user data', async () => {
            const res = await request(app)
                .post('/protected/getPublicUserData')
                .set('x-access-token', validToken)
                .send({ value: 'test' });
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('POST /protected/endorse', () => {
        it('should endorse a skill', async () => {
            const targetUser = await User.create({
                username: 'targetuser',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillA', endorsement: [] }],
                trees: []
            });
            const res = await request(app)
                .post('/protected/endorse')
                .set('x-access-token', validToken)
                .send({ username: 'targetuser', skillName: 'SkillA' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject duplicate endorsement', async () => {
            await User.create({
                username: 'targetuser',
                hashData: security.hashPassword('pw'),
                skills: [{ name: 'SkillA', endorsement: ['testuser'] }],
                trees: []
            });
            const res = await request(app)
                .post('/protected/endorse')
                .set('x-access-token', validToken)
                .send({ username: 'targetuser', skillName: 'SkillA' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Already');
        });
    });

    describe('POST /protected/newpassword', () => {
        it('should update password with correct old password', async () => {
            const res = await request(app)
                .post('/protected/newpassword')
                .set('x-access-token', validToken)
                .send({ oldPassword: 'pw', newPassword: 'newpw123' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject wrong old password', async () => {
            const res = await request(app)
                .post('/protected/newpassword')
                .set('x-access-token', validToken)
                .send({ oldPassword: 'wrong', newPassword: 'newpw123' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /protected/newhelp', () => {
        it('should update willingToTeach', async () => {
            const res = await request(app)
                .post('/protected/newhelp')
                .set('x-access-token', validToken)
                .send({ help: true });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /protected/firstlogindata', () => {
        const Tree = require('../../../src/models/treemodel');

        it('should save first login data', async () => {
            await Tree.create({ name: 'MainTree', focusArea: 'Dev' });
            const res = await request(app)
                .post('/protected/firstlogindata')
                .set('x-access-token', validToken)
                .send({ mainTree: 'MainTree', focusArea: 'Dev' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject when tree not found', async () => {
            const res = await request(app)
                .post('/protected/firstlogindata')
                .set('x-access-token', validToken)
                .send({ mainTree: 'NonExistent', focusArea: 'Dev' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(false);
        });
    });
});
