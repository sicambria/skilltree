const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyToken = (req, res, next) => {
    const token = req.get('x-access-token');

    if (token) {
        jwt.verify(token, config.secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(401).json({ success: false, message: 'No token provided.' });
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
