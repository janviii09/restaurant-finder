const { NODE_ENV } = require('../config/env');

/**
 * Global error handler middleware.
 * Must be registered AFTER all routes: app.use(errorHandler)
 */
function errorHandler(err, req, res, _next) {
  // Log full error in dev, summary in prod
  if (NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  } else {
    console.error('💥 Error:', err.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});

    return res.status(422).json({
      status: 422,
      error: 'Validation failed',
      details,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      status: 409,
      error: `Duplicate value for "${field}". This ${field} is already taken.`,
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      status: 400,
      error: 'Invalid resource ID format.',
    });
  }

  // JWT errors (fallback — normally caught in auth middleware)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 401,
      error: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 401,
      error: 'Token expired.',
    });
  }

  // Default
  const statusCode = err.statusCode || 500;
  const message =
    NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  res.status(statusCode).json({
    status: statusCode,
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
