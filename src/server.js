const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // Connect to Database
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    server.on('error', (error) => {
        if (error.syscall !== 'listen') throw error;
        switch (error.code) {
            case 'EADDRINUSE':
                console.error('--------------------------------------------------');
                console.error(`❌ Error: Port ${PORT} is already in use.`);
                console.error(`💡 Suggestion: Kill the process on port ${PORT} or use a different port.`);
                console.error('--------------------------------------------------');
                process.exit(1);
                break;
            default:
                throw error;
        }
    });

    server.listen(PORT, () => {
        const url = `http://localhost:${PORT}`;
        console.log('--------------------------------------------------');
        console.log(`🚀 Skill Tree Server is running!`);
        console.log(`🔗 Local URL:   ${url}`);
        console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📦 Node.js:    ${process.version}`);
        console.log(`🆔 Process ID:  ${process.pid}`);
        console.log('--------------------------------------------------');
        console.log('Press Ctrl+C to stop the server');
        console.log('');
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log('🛑 Shutting down server...');
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

startServer();
