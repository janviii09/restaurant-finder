const { Redis } = require('@upstash/redis');
const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = require('./env');

let redis = null;

if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn('⚠️  Upstash Redis credentials not set. Caching disabled.');
}

/**
 * Safe cache get — returns null if Redis is unavailable.
 */
async function cacheGet(key) {
  if (!redis) return null;
  try {
    return await redis.get(key);
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
    await redis.set(key, value, { ex: ttl });
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
