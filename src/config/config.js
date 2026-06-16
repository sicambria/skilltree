module.exports = {
    'secret': process.env.JWT_SECRET || 'verysecret',
    'database': process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skilltreenew'
};
