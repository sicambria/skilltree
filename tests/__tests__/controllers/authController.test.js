const mongoose = require('mongoose');
const { connectTestDB, disconnectTestDB, clearTestDB } = require('../../helpers/db');
const User = require('../../../src/models/usermodel');
const Category = require('../../../src/models/categorymodel');
const Tree = require('../../../src/models/treemodel');

beforeAll(async () => await connectTestDB());
afterAll(async () => await disconnectTestDB());
afterEach(async () => await clearTestDB());

describe('authController', () => {
    let authController;
    let req, res;

    beforeEach(() => {
        authController = require('../../../src/controllers/authController');
        req = { body: {} };
        res = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };
    });

    describe('registration', () => {
        it('should register a new user and return token', async () => {
            await Category.create({ name: 'General' });
            req.body = { username: 'newuser', password: 'password123', email: 'new@test.com' };

            await authController.registration(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.token).toBeDefined();

            const user = await User.findOne({ username: 'newuser' });
            expect(user).not.toBeNull();
            expect(user.email).toBe('new@test.com');
        });

        it('should not register duplicate username', async () => {
            await User.create({ username: 'existing', email: 'existing@test.com', hashData: Buffer.from('hash') });
            req.body = { username: 'existing', password: 'pass', email: 'a@b.com' };

            await authController.registration(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: false });
        });

        it('should use fallback defaults when req.body is empty object', async () => {
            req.body = {};

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Username must be 2-50 characters.'
            });
        });

        it('should use fallback defaults when req.body fields are null', async () => {
            req.body = { username: null, password: 'password123' };

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Username must be 2-50 characters.'
            });
        });

        it('should reject short username', async () => {
            req.body = { username: 'a', password: 'password123' };

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Username must be 2-50 characters.'
            });
        });

        it('should reject short password', async () => {
            req.body = { username: 'validuser', password: 'ab' };

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Password must be at least 4 characters.'
            });
        });

        it('should skip email validation when email is empty string', async () => {
            await Category.create({ name: 'General' });
            req.body = { username: 'validuser', password: 'password123', email: '' };

            await authController.registration(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.token).toBeDefined();
        });

        it('should reject invalid email', async () => {
            req.body = {
                username: 'validuser',
                password: 'password123',
                email: 'a'.repeat(255)
            };

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid email.'
            });
        });

        it('should register user with focus area and map tree names', async () => {
            await Tree.create({ name: 'WebDev', focusArea: 'Development' });
            await Tree.create({ name: 'MobileDev', focusArea: 'Development' });
            await Category.create({ name: 'General' });

            req.body = {
                username: 'focususer',
                password: 'password123',
                email: 'focus@test.com',
                focusArea: 'Development'
            };

            await authController.registration(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.token).toBeDefined();

            const user = await User.findOne({ username: 'focususer' });
            expect(user).not.toBeNull();
        });

        it('should handle server error gracefully', async () => {
            req.body = { username: 'validuser', password: 'pass1234' };
            const mockFindOne = jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));

            await authController.registration(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error during registration'
            });
            mockFindOne.mockRestore();
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            const security = require('../../../src/utils/security');
            const hashData = security.hashPassword('correctpw');
            await User.create({ username: 'testuser', hashData: hashData });
        });

        it('should login with correct credentials', async () => {
            req.body = { username: 'testuser', password: 'correctpw' };

            await authController.login(req, res);

            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.token).toBeDefined();
            expect(response.message).toBe('Authenticated.');
        });

        it('should reject wrong password', async () => {
            req.body = { username: 'testuser', password: 'wrongpw' };

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication failed. Wrong password.'
            });
        });

        it('should reject non-existent user', async () => {
            req.body = { username: 'nonexistent', password: 'somepw' };

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        });

        it('should include admin status in token for admin user', async () => {
            const security = require('../../../src/utils/security');
            const hashData = security.hashPassword('adminpw');
            await User.create({ username: 'adminuser', admin: true, hashData: hashData });

            req.body = { username: 'adminuser', password: 'adminpw' };

            await authController.login(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);

            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(response.token, 'verysecret');
            expect(decoded.admin).toBe(true);
        });

        it('should reject missing credentials', async () => {
            req.body = {};

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Username and password required.'
            });
        });

        it('should handle server error', async () => {
            const mockFindOne = jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB error'));
            req.body = { username: 'test', password: 'pass' };

            await authController.login(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Server error during authentication'
            });
            mockFindOne.mockRestore();
        });
    });
});
