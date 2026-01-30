const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    // Connect to Database
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
