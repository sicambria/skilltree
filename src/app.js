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

module.exports = app;
