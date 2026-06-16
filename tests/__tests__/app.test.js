const request = require('supertest');
const { connectTestDB, disconnectTestDB } = require('../helpers/db');
const mongoose = require('mongoose');

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
    let testApp;

    beforeEach(() => {
        testApp = require('express')();
    });

    it('should handle ValidationError with 400 and list of issues', async () => {
        testApp.get('/test', (req, res, next) => {
            const err = new mongoose.Error.ValidationError();
            err.errors = {
                email: { message: 'Invalid email' },
                name: { message: 'Name is required' }
            };
            next(err);
        });
        testApp.use(app.errorHandler);

        const res = await request(testApp).get('/test');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Validation Error');
        expect(res.body.issues).toEqual(['Invalid email', 'Name is required']);
    });

    it('should handle CastError with 400 and path details', async () => {
        testApp.get('/test', (req, res, next) => {
            next(new mongoose.Error.CastError('ObjectId', 'badvalue', 'testField'));
        });
        testApp.use(app.errorHandler);

        const res = await request(testApp).get('/test');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid testField: badvalue');
    });

    it('should handle custom error with given status and message', async () => {
        testApp.get('/test', (req, res, next) => {
            const err = new Error('Custom error message');
            err.status = 418;
            next(err);
        });
        testApp.use(app.errorHandler);

        const res = await request(testApp).get('/test');

        expect(res.status).toBe(418);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Custom error message');
    });

    it('should return 500 for error with no status', async () => {
        testApp.get('/test', (req, res, next) => {
            next(new Error('Plain error'));
        });
        testApp.use(app.errorHandler);

        const res = await request(testApp).get('/test');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Plain error');
    });

    it('should fallback to Internal Server Error when error has no message', async () => {
        testApp.get('/test', (req, res, next) => {
            next({ status: 500 });
        });
        testApp.use(app.errorHandler);

        const res = await request(testApp).get('/test');

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Internal Server Error');
    });

    describe('development mode', () => {
        const ORIG_NODE_ENV = process.env.NODE_ENV;

        beforeAll(() => {
            process.env.NODE_ENV = 'development';
        });

        afterAll(() => {
            process.env.NODE_ENV = ORIG_NODE_ENV;
        });

        it('should log stack trace and include it in response', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const devApp = require('express')();
            devApp.get('/test', (req, res, next) => {
                next(new Error('Dev mode error'));
            });
            devApp.use(app.errorHandler);

            const res = await request(devApp).get('/test');

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Dev mode error');
            expect(res.body.stack).toBeDefined();

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Stack:')
            );

            consoleSpy.mockRestore();
        });
    });
});
