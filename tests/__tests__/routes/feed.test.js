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

describe('Protected Feed Routes', () => {
    const User = require('../../../src/models/usermodel');
    const FeedPost = require('../../../src/models/feedpostmodel');
    const security = require('../../../src/utils/security');

    beforeEach(async () => {
        await User.create({
            username: 'testuser',
            hashData: security.hashPassword('pw'),
            skills: [],
            trees: []
        });
    });

    describe('GET /protected/feed', () => {
        it('should return feed posts', async () => {
            await FeedPost.create({ username: 'u1', type: 'qa', body: 'Hello' });

            const res = await request(app)
                .get('/protected/feed')
                .set('x-access-token', validToken);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });

        it('should reject without token', async () => {
            const res = await request(app).get('/protected/feed');
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/feed', () => {
        it('should create a post', async () => {
            const res = await request(app)
                .post('/protected/feed')
                .set('x-access-token', validToken)
                .send({ type: 'qa', body: 'How do I learn X?' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.post.body).toBe('How do I learn X?');
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/feed')
                .send({ type: 'qa', body: 'test' });
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/feed/comment', () => {
        it('should add a comment', async () => {
            const post = await FeedPost.create({ username: 'author', type: 'qa', body: 'Question?' });

            const res = await request(app)
                .post('/protected/feed/comment')
                .set('x-access-token', validToken)
                .send({ postId: post._id.toString(), body: 'Good question!' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/feed/comment')
                .send({ postId: new mongoose.Types.ObjectId().toString(), body: 'test' });
            expect(res.status).toBe(401);
        });
    });

    describe('POST /protected/feed/delete', () => {
        it('should delete own post', async () => {
            const post = await FeedPost.create({ username: 'testuser', type: 'qa', body: 'My post' });

            const res = await request(app)
                .post('/protected/feed/delete')
                .set('x-access-token', validToken)
                .send({ postId: post._id.toString() });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject without token', async () => {
            const res = await request(app)
                .post('/protected/feed/delete')
                .send({ postId: new mongoose.Types.ObjectId().toString() });
            expect(res.status).toBe(401);
        });
    });
});
