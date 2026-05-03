const { cacheGet, cacheSet } = require('../config/redis');

// ─── Nominatim API config ─────────────────────────────────────────
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'RestaurantFinder/1.0 (student-project; contact@restaurantfinder.app)';
const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// ─── Rate-limiting queue (1 req/sec to respect Nominatim policy) ──
let lastRequestTime = 0;

async function throttledFetch(url) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;

  if (elapsed < 1000) {
    const waitMs = 1000 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim responded with ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════
//  REVERSE GEOCODE — (lat, lng) → address
// ═══════════════════════════════════════════════════════════════════

/**
 * Reverse geocode coordinates to an address.
 * Results are cached in Redis for 7 days.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Address object
 */
async function reverseGeocode(lat, lng) {
  // Round to 5 decimals (~1m precision) for consistent cache keys
  const roundedLat = parseFloat(lat).toFixed(5);
  const roundedLng = parseFloat(lng).toFixed(5);
  const cacheKey = `geo:rev:${roundedLat},${roundedLng}`;

  // 1. Check Redis cache
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return { ...cached, _cached: true };
  }

  // 2. Call Nominatim (rate-limited)
  const url =
    `${NOMINATIM_BASE}/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=18&addressdetails=1`;

  const data = await throttledFetch(url);

  const result = {
    displayName: data.display_name || '',
    street: data.address?.road || data.address?.pedestrian || '',
    area: data.address?.suburb || data.address?.neighbourhood || '',
    city: data.address?.city || data.address?.town || data.address?.village || 'Noida',
    state: data.address?.state || '',
    pincode: data.address?.postcode || '',
    country: data.address?.country || 'India',
  };

  // 3. Cache in Redis (7 days)
  await cacheSet(cacheKey, result, CACHE_TTL);

  return result;
}

// ═══════════════════════════════════════════════════════════════════
//  FORWARD GEOCODE — address text → (lat, lng)
// ═══════════════════════════════════════════════════════════════════

/**
 * Forward geocode an address string to coordinates.
 * Results are cached in Redis for 7 days.
 *
 * @param {string} query - Address or place name
 * @returns {Promise<object|null>} { lat, lng, displayName } or null
 */
async function forwardGeocode(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `geo:fwd:${normalizedQuery}`;

  // 1. Check Redis cache
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return { ...cached, _cached: true };
  }

  // 2. Call Nominatim (rate-limited)
  const url =
    `${NOMINATIM_BASE}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&addressdetails=1&countrycodes=in`;

  const data = await throttledFetch(url);

  if (!data || data.length === 0) {
    return null;
  }

  const first = data[0];
  const result = {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name || '',
    area: first.address?.suburb || first.address?.neighbourhood || '',
    city: first.address?.city || first.address?.town || 'Noida',
    pincode: first.address?.postcode || '',
  };

  // 3. Cache in Redis (7 days)
  await cacheSet(cacheKey, result, CACHE_TTL);

  return result;
}

module.exports = {
  reverseGeocode,
  forwardGeocode,
};
