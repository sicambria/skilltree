require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PREFERRED_PORT = parseInt(process.env.PORT, 10) || 3000;

const startServer = async () => {
    // Connect to Database
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    const tryListen = (port) => new Promise((resolve, reject) => {
        server.once('error', (error) => {
            if (error.code === 'EADDRINUSE' && port < PREFERRED_PORT + 10) {
                tryListen(port + 1).then(resolve, reject);
            } else {
                reject(error);
            }
        });
        server.listen(port, () => resolve(server.address().port));
    });

    const PORT = await tryListen(PREFERRED_PORT);
    const url = `http://localhost:${PORT}`;
    console.log('--------------------------------------------------');
    console.log(`🚀 Skill Tree Server is running!`);
    console.log(`🔗 Local URL:   ${url}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Node.js:    ${process.version}`);
    console.log(`🆔 Process ID:  ${process.pid}`);
    if (PORT !== PREFERRED_PORT) {
        console.log(`⚠️  Port ${PREFERRED_PORT} was in use, using port ${PORT} instead.`);
    }
    console.log('--------------------------------------------------');
    console.log('Press Ctrl+C to stop the server');
    console.log('');

    // Process error handling
    process.on('unhandledRejection', (reason, promise) => {
        console.error('--------------------------------------------------');
        console.error('❌ UNHANDLED REJECTION! 💥 Shutting down...');
        console.error('- Reason:', reason);
        console.error('--------------------------------------------------');
        process.exit(1);
    });

    process.on('uncaughtException', (err) => {
        console.error('--------------------------------------------------');
        console.error('❌ UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.error('- Error:', err.message);
        console.error('- Stack:', err.stack);
        console.error('--------------------------------------------------');
        process.exit(1);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
        console.log(`🛑 ${signal} received. Shutting down server...`);
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

// Global startup with wrapper to catch top-level errors
const run = async () => {
    try {
        await startServer();
    } catch (error) {
        console.error('--------------------------------------------------');
        console.error('❌ CRITICAL STARTUP ERROR!');
        console.error(`- Message: ${error.message}`);
        console.error('- Stack:', error.stack);
        console.error('--------------------------------------------------');
        process.exit(1);
    }
};

run();
