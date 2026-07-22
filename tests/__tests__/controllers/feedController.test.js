const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const FeedPost = require('../../../src/models/feedpostmodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('feedController', () => {
    let feedController;
    let req, res;

    beforeEach(() => {
        feedController = require('../../../src/controllers/feedController');
        req = { body: {}, decoded: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('getFeed', () => {
        it('should return posts sorted by createdAt desc with limit 50', async () => {
            await FeedPost.create({ username: 'u1', type: 'qa', body: 'Post 1' });
            await FeedPost.create({ username: 'u2', type: 'levelup', body: 'Post 2', skillName: 'SkillA', skillLevel: 3 });

            await feedController.getFeed(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.length).toBe(2);
            expect(data[0].body).toBe('Post 2');
            expect(data[1].body).toBe('Post 1');
        });

        it('should return empty array when no posts', async () => {
            await feedController.getFeed(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should handle server error', async () => {
            const mockLimit = jest.fn().mockRejectedValue(new Error('DB error'));
            const mockSort = jest.fn().mockReturnValue({ limit: mockLimit });
            jest.spyOn(FeedPost, 'find').mockReturnValue({ sort: mockSort });

            await feedController.getFeed(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('createPost', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
        });

        it('should create a post', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { type: 'qa', body: 'How do I learn X?' };

            await feedController.createPost(req, res);

            expect(res.json).toHaveBeenCalled();
            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.post.type).toBe('qa');
            expect(data.post.username).toBe('testuser');

            const post = await FeedPost.findOne({ username: 'testuser' });
            expect(post).not.toBeNull();
        });

        it('should create a training offer post with skillName and skillLevel', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { type: 'trainingoffer', body: 'Teaching JS', skillName: 'JavaScript', skillLevel: 4 };

            await feedController.createPost(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);
            expect(data.post.skillName).toBe('JavaScript');
            expect(data.post.skillLevel).toBe(4);
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { type: 'qa', body: 'test' };

            await feedController.createPost(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { type: 'qa', body: 'test' };

            await feedController.createPost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('createComment', () => {
        let post;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'testuser',
                hashData: security.hashPassword('pw'),
                skills: [],
                trees: []
            });
            post = await FeedPost.create({ username: 'author', type: 'qa', body: 'Question?' });
        });

        it('should add a comment to a post', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { postId: post._id.toString(), body: 'Great question!' };

            await feedController.createComment(req, res);

            const data = res.json.mock.calls[0][0];
            expect(data.success).toBe(true);

            const updated = await FeedPost.findById(post._id);
            expect(updated.comments.length).toBe(1);
            expect(updated.comments[0].username).toBe('testuser');
            expect(updated.comments[0].body).toBe('Great question!');
        });

        it('should return error when user not found', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { postId: post._id.toString(), body: 'test' };

            await feedController.createComment(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should return error when post not found', async () => {
            req.decoded = { username: 'testuser' };
            req.body = { postId: new mongoose.Types.ObjectId().toString(), body: 'test' };

            await feedController.createComment(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Post not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(FeedPost, 'findById').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'testuser' };
            req.body = { postId: post._id.toString(), body: 'test' };

            await feedController.createComment(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });

    describe('deletePost', () => {
        let post;

        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            await User.create({
                username: 'owner',
                hashData: security.hashPassword('pw'),
                admin: false,
                skills: [],
                trees: []
            });
            await User.create({
                username: 'otheruser',
                hashData: security.hashPassword('pw'),
                admin: false,
                skills: [],
                trees: []
            });
            await User.create({
                username: 'adminuser',
                hashData: security.hashPassword('pw'),
                admin: true,
                skills: [],
                trees: []
            });
            post = await FeedPost.create({ username: 'owner', type: 'qa', body: 'My post' });
        });

        it('should allow owner to delete their post', async () => {
            req.decoded = { username: 'owner' };
            req.body = { postId: post._id.toString() };

            await feedController.deletePost(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });

            const deleted = await FeedPost.findById(post._id);
            expect(deleted).toBeNull();
        });

        it('should allow admin to delete any post', async () => {
            req.decoded = { username: 'adminuser' };
            req.body = { postId: post._id.toString() };

            await feedController.deletePost(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        it('should reject non-owner non-admin delete', async () => {
            req.decoded = { username: 'otheruser' };
            req.body = { postId: post._id.toString() };

            await feedController.deletePost(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized.'
            });
        });

        it('should return error when user not found in deletePost', async () => {
            req.decoded = { username: 'nonexistent' };
            req.body = { postId: post._id.toString() };

            await feedController.deletePost(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found.'
            });
        });

        it('should return error when post not found', async () => {
            const otherUser = await User.findOne({ username: 'owner' });
            req.decoded = { username: 'owner' };
            req.body = { postId: new mongoose.Types.ObjectId().toString() };

            await feedController.deletePost(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Post not found.'
            });
        });

        it('should handle server error', async () => {
            jest.spyOn(FeedPost, 'findById').mockRejectedValue(new Error('DB error'));
            req.decoded = { username: 'owner' };
            req.body = { postId: post._id.toString() };

            await feedController.deletePost(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error'
            });
            jest.restoreAllMocks();
        });
    });
});
