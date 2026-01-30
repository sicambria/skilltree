const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.database);
        console.log('Connected to database');
    } catch (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
