const Redis = require('ioredis');
const { REDIS_URL } = require('./env');

let redis = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) {
        console.error('❌ Redis: max retries reached, giving up.');
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => console.log('✅ Redis connected'));
  redis.on('error', (err) => console.error('❌ Redis error:', err.message));
} else {
  console.warn('⚠️  REDIS_URL not set — caching disabled. Set REDIS_URL in .env for production.');
}

/**
 * Safe cache get — returns null if Redis is unavailable.
 */
async function cacheGet(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

/**
 * Safe cache set — silently fails if Redis is unavailable.
 * @param {string} key
 * @param {*} value - Will be JSON-stringified
 * @param {number} ttl - Time-to-live in seconds
 */
async function cacheSet(key, value, ttl = 3600) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    // Silently fail — cache is optional
  }
}

/**
 * Safe cache delete.
 */
async function cacheDel(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

module.exports = { redis, cacheGet, cacheSet, cacheDel };
