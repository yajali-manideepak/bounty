const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const db = require('./db');
const { errorHandler, notFoundHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const bugRoutes = require('./routes/bug.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const auditRoutes = require('./routes/audit.routes');

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: env.clientOrigin,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Auth rate limiter to protect against brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { message: 'Too many login attempts. Please try again in 15 minutes.' }
  }
});

// Health Check Endpoint (Required by Phase 1 criteria)
app.get('/api/health', async (req, res, next) => {
  try {
    // Verify database connectivity
    await db.get('SELECT 1 AS alive');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/bugs/:bugId/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', auditRoutes);

// Serve static frontend assets if built
const path = require('path');
const fs = require('fs');
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Catch 404 & forward to error handler (for unhandled /api/* routes)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;
