const mongoose = require('mongoose');
const config = require('./config');

const connectDB = async () => {
    try {
        await mongoose.connect(config.database);
        const maskedDb = config.database.replace(/\/\/.*@/, '//****:****@');
        console.log(`✅ Connected to database: ${maskedDb}`);
    } catch (err) {
        console.error('--------------------------------------------------');
        console.error('❌ Database connection error!');
        console.error(`🔍 URI: ${config.database.replace(/\/\/.*@/, '//****:****@')}`);
        console.error(`📂 Details: ${err.message}`);
        console.error('--------------------------------------------------');
        process.exit(1);
    }
};

module.exports = connectDB;
