const jwt = require('jsonwebtoken');
const config = require('../config/config');
const path = require('path');

const verifyToken = (req, res, next) => {
    const token = req.get('x-access-token');

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                // In a real API, we should return 401 instead of sending a file,
                // but maintaining legacy behavior for now.
                return res.sendFile('login.html', { root: path.join(__dirname, '../../public') });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.sendFile('login.html', { root: path.join(__dirname, '../../public') });
    }
};

const verifyAdmin = (req, res, next) => {
    const token = req.get('x-access-token');

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else if (decoded.admin) {
                req.decoded = decoded;
                next();
            } else {
                return res.status(403).send({
                    success: false,
                    message: 'Not admin.'
                });
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
};

module.exports = {
    verifyToken,
    verifyAdmin
};
