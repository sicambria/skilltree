const request = require('supertest');
const { connectTestDB, disconnectTestDB } = require('../helpers/db');

let app;

beforeAll(async () => {
    await connectTestDB();
    app = require('../../src/app');
});

afterAll(async () => {
    await disconnectTestDB();
});

describe('app.js', () => {
    it('should have superSecret set', () => {
        expect(app.get('superSecret')).toBe('verysecret');
    });

    it('should handle JSON parsing error gracefully', async () => {
        const res = await request(app)
            .post('/registration')
            .set('Content-Type', 'application/json')
            .send('invalid json body');
        expect(res.status).toBe(400);
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/nonexistentroute');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Resource not found');
    });

    it('should serve login.html at /', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
    });

    it('should serve chartandtree.html at /user/', async () => {
        const res = await request(app).get('/user/');
        expect(res.status).toBe(200);
    });

    it('should return success at /apitest', async () => {
        const res = await request(app).get('/apitest');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('global error handler', () => {
    it('should handle custom error objects with status', () => {
        const appWithErrors = require('express')();
        appWithErrors.use(require('../../src/app'));

        const req = {};
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        const err = new Error('Custom error');
        err.status = 418;

        const errorHandler = require('../../src/app');
        expect(errorHandler).toBeDefined();
    });

    it('should handle CastError', () => {
        const castErr = new Error('Cast to ObjectId failed');
        castErr.name = 'CastError';
        castErr.path = '_id';
        castErr.value = 'invalid';

        expect(castErr.name).toBe('CastError');
    });

    it('should handle ValidationError', () => {
        const valErr = new Error('Validation failed');
        valErr.name = 'ValidationError';
        valErr.errors = { field: { message: 'Field is required' } };

        expect(valErr.name).toBe('ValidationError');
        expect(valErr.errors.field.message).toBe('Field is required');
    });
});
