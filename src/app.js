const express = require('express');
const path = require('path');
const morgan = require('morgan');
const config = require('./config/config');
const routes = require('./routes');

const app = express();

// Configuration
app.set('superSecret', config.secret);

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Basic routes (legacy compatibility)
app.get('/', (req, res) => res.sendFile('login.html', { root: path.join(__dirname, '../public') }));
app.get('/user', (req, res) => res.sendFile('chartandtree.html', { root: path.join(__dirname, '../public/user') }));

app.get('/apitest', (req, res) => res.json({ success: true }));

// API Routes
app.use('/', routes);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`❌ Error stack: ${err.stack}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

module.exports = app;
