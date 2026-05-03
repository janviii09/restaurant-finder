const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { authLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const connectDB = require('./config/db');
const { redis } = require('./config/redis');
const { PORT, NODE_ENV, CLIENT_URL } = require('./config/env');

// ═══════════════════════════════════════════════════════════════════
//  EXPRESS APP SETUP
// ═══════════════════════════════════════════════════════════════════
const app = express();

// ─── Security headers ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS — allow frontend origin ─────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // Allow cookies (refresh tokens)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Global rate limiter ──────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests. Please try again later.',
  },
});
app.use(globalLimiter);

// ═══════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    redis: redis ? 'connected' : 'disabled',
  });
});

// API routes
app.use('/api/auth',        authLimiter, require('./routes/auth'));
app.use('/api/restaurants',  require('./routes/restaurants'));
// app.use('/api/reviews',      require('./routes/reviews'));
// app.use('/api/users',        require('./routes/users'));
// app.use('/api/admin',        require('./routes/admin'));
app.use('/api/geocode',      require('./routes/geocode'));

// ─── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global error handler ─────────────────────────────────────────
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════════════════
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Connect to Redis (if configured)
  if (redis) {
    try {
      await redis.connect();
    } catch (err) {
      console.warn('⚠️  Redis connect failed (continuing without cache):', err.message);
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });

  // ─── Graceful shutdown ─────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n📴 ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('   ✅ MongoDB connection closed');

        if (redis) {
          await redis.quit();
          console.log('   ✅ Redis connection closed');
        }
      } catch (err) {
        console.error('   ❌ Error during shutdown:', err);
      }

      console.log('   👋 Process exiting.\n');
      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('   ⚠️  Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();

module.exports = app; // For testing
