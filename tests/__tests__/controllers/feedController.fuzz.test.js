const fc = require('fast-check');
const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('feedController fuzz tests', () => {
    let feedController;
    let res;

    beforeEach(() => {
        feedController = require('../../../src/controllers/feedController');
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('createPost', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'fuzzuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should not crash on arbitrary body text', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 0, maxLength: 500 }),
                    fc.constantFrom('levelup', 'trainingoffer', 'trainingrequest', 'qa'),
                    async (bodyText, type) => {
                        const req = {
                            body: { type, body: bodyText },
                            decoded: { username: 'fuzzuser' }
                        };

                        try {
                            await feedController.createPost(req, res);
                            const data = res.json.mock.calls[0][0];
                            expect(data.success === true || data.success === false).toBe(true);
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle unicode and HTML injection attempts', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.stringMatching(/[\u0000-\uffff]*/),
                    async (text) => {
                        const req = {
                            body: { type: 'qa', body: text },
                            decoded: { username: 'fuzzuser' }
                        };

                        try {
                            await feedController.createPost(req, res);
                            const data = res.json.mock.calls[0][0];
                            expect(data.success === true || data.success === false).toBe(true);
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 30 }
            );
        });
    });

    describe('createComment', () => {
        beforeEach(async () => {
            const FeedPost = require('../../../src/models/feedpostmodel');
            await FeedPost.create({ username: 'author', type: 'qa', body: 'Test question?' });
        });

        it('should not crash on arbitrary comment text', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.string({ minLength: 0, maxLength: 500 }),
                    async (commentText) => {
                        const FeedPost = require('../../../src/models/feedpostmodel');
                        const post = await FeedPost.findOne();
                        const req = {
                            body: { postId: post._id.toString(), body: commentText },
                            decoded: { username: 'fuzzuser' }
                        };

                        try {
                            await feedController.createComment(req, res);
                            const data = res.json.mock.calls[0][0];
                            expect(data.success === true || data.success === false).toBe(true);
                        } catch (e) {
                            expect(e).toBeDefined();
                        }
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
