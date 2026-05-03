const axios = require('axios');
const { redis } = require('../config/redis');
const { OVERPASS_API_URL } = require('../config/env');

function roundBucket(value) {
  return Math.round(value * 100) / 100;
}

function overpassQuery(lat, lng, radius) {
  const ql = [
    '[out:json][timeout:28];',
    '(',
    '  node["amenity"="restaurant"](around:RADIUS,LAT,LNG);',
    '  way["amenity"="restaurant"](around:RADIUS,LAT,LNG);',
    '  node["amenity"="cafe"](around:RADIUS,LAT,LNG);',
    '  way["amenity"="cafe"](around:RADIUS,LAT,LNG);',
    '  node["amenity"="fast_food"](around:RADIUS,LAT,LNG);',
    '  way["amenity"="fast_food"](around:RADIUS,LAT,LNG);',
    '  node["amenity"="food_court"](around:RADIUS,LAT,LNG);',
    ');',
    'out body;',
    '>;',
    'out skel qt;',
  ].join('\n');

  return ql
    .replaceAll('RADIUS', String(radius))
    .replaceAll('LAT', String(lat))
    .replaceAll('LNG', String(lng));
}

function mapElement(el) {
  let lat;
  let lon;

  if (el.type === 'node') {
    lat = el.lat;
    lon = el.lon;
  } else if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length > 0) {
    const lats = el.geometry.map((p) => p.lat);
    const lons = el.geometry.map((p) => p.lon);
    lat = lats.reduce((a, b) => a + b, 0) / lats.length;
    lon = lons.reduce((a, b) => a + b, 0) / lons.length;
  }

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return null;
  }

  return {
    osmId: String(el.id),
    type: el.type,
    name: el.tags?.name || 'Unnamed',
    amenity: el.tags?.amenity,
    cuisine: el.tags?.cuisine || null,
    opening_hours: el.tags?.opening_hours || null,
    phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
    website: el.tags?.website || null,
    address:
      [el.tags?.['addr:housenumber'], el.tags?.['addr:street']]
        .filter(Boolean)
        .join(' ') || null,
    lat,
    lon,
  };
}

exports.getNearby = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number.parseInt(req.query.radius, 10);

    if (
      req.query.lat === undefined ||
      req.query.lng === undefined ||
      req.query.radius === undefined ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      Number.isNaN(radius)
    ) {
      return res.status(400).json({ error: 'lat, lng, radius are required' });
    }

    const cacheKey = `restaurants:${roundBucket(lat)}:${roundBucket(lng)}:${radius}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return res.status(200).json(parsed);
      }
    }

    const query = overpassQuery(lat, lng, radius);

    let response;
    try {
      response = await axios.post(OVERPASS_API_URL, query, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'JIITFoodFinder/1.0 (contact: your@email.com)',
          'Accept-Encoding': 'gzip',
        },
        timeout: 30000,
        validateStatus: () => true,
      });
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({ error: 'Overpass API timed out. Try a smaller radius.' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (response.status !== 200) {
      return res.status(502).json({ error: 'Overpass API error', status: response.status });
    }

    const elements = Array.isArray(response.data?.elements) ? response.data.elements : [];

    const mapped = elements
      .filter((el) => el?.tags?.name !== undefined)
      .map(mapElement)
      .filter(Boolean);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(mapped), { ex: 86400 });
    }

    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
