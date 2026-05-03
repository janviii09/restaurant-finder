const rateLimit = require('express-rate-limit');

/**
 * Stricter rate limiter for auth routes (login, register).
 * Prevents brute-force and credential-stuffing attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                    // 15 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

/**
 * Rate limiter for upload endpoints.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,              // 10 uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many uploads. Please slow down.',
  },
});

/**
 * Rate limiter for geocoding proxy to respect Nominatim 1 req/sec.
 * This is a per-server limiter as a safeguard on top of the service-level queue.
 */
const geocodeLimiter = rateLimit({
  windowMs: 1000,  // 1 second
  max: 1,          // 1 request per second
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Geocoding rate limit reached. Please wait a moment.',
  },
});

module.exports = {
  authLimiter,
  uploadLimiter,
  geocodeLimiter,
};
