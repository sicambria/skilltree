const jwt = require('jsonwebtoken');

describe('auth middleware', () => {
    let auth;
    let req, res, next;

    beforeEach(() => {
        jest.resetModules();
        req = { get: jest.fn() };
        res = {
            sendFile: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        auth = require('../../../src/middleware/auth');
    });

    describe('verifyToken', () => {
        it('should call next() when valid token is provided', () => {
            const payload = { username: 'testuser', admin: true };
            const validToken = jwt.sign(payload, 'verysecret');
            req.get.mockReturnValue(validToken);

            auth.verifyToken(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.decoded).toBeDefined();
            expect(req.decoded.username).toBe('testuser');
            expect(req.decoded.admin).toBe(true);
        });

        it('should return 401 when invalid token is provided', () => {
            req.get.mockReturnValue('invalidtoken');

            auth.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to authenticate token.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when no token is provided', () => {
            req.get.mockReturnValue(null);

            auth.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No token provided.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is undefined', () => {
            req.get.mockReturnValue(undefined);

            auth.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No token provided.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is expired', () => {
            const expiredToken = jwt.sign({ username: 'test' }, 'verysecret', { expiresIn: '0s' });
            req.get.mockReturnValue(expiredToken);

            auth.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to authenticate token.' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is signed with wrong secret', () => {
            const token = jwt.sign({ username: 'test' }, 'wrongsecret');
            req.get.mockReturnValue(token);

            auth.verifyToken(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to authenticate token.' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('verifyAdmin', () => {
        it('should call next() when valid admin token is provided', () => {
            const payload = { username: 'admin', admin: true };
            const validToken = jwt.sign(payload, 'verysecret');
            req.get.mockReturnValue(validToken);

            auth.verifyAdmin(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.decoded.username).toBe('admin');
            expect(req.decoded.admin).toBe(true);
        });

        it('should return 403 when valid non-admin token is provided', () => {
            const payload = { username: 'user', admin: false };
            const validToken = jwt.sign(payload, 'verysecret');
            req.get.mockReturnValue(validToken);

            auth.verifyAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Not admin.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 when invalid token is provided', () => {
            req.get.mockReturnValue('invalidtoken');

            auth.verifyAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to authenticate token.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 when no token is provided', () => {
            req.get.mockReturnValue(null);

            auth.verifyAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: 'No token provided.'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 when token is expired', () => {
            const expiredToken = jwt.sign({ username: 'admin', admin: true }, 'verysecret', { expiresIn: '0s' });
            req.get.mockReturnValue(expiredToken);

            auth.verifyAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
