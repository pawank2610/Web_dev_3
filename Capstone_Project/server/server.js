const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'ShortLink API (Bitly Clone)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/links', require('./routes/linkRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Short Code Redirection Route (e.g. GET /abc1234)
app.use('/', require('./routes/redirectRoutes'));

// Centralized Error-Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  ShortLink Backend MVC Server Running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Base URL:    ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.message}`);
});

module.exports = app;
