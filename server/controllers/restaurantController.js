const axios = require('axios');
const { redis } = require('../config/redis');
const { GEOAPIFY_API_KEY } = require('../config/env');

function normalizeCategory(category) {
  if (!category) return null;
  const value = String(category);
  if (value === 'catering.restaurant') return 'Restaurant';
  if (value === 'catering.cafe') return 'Café';
  if (value === 'catering.fast_food') return 'Fast Food';
  if (value === 'catering.food_court') return 'Food Court';
  if (value === 'catering.street_food') return 'Street Food';
  const stripped = value.replace(/^catering\./, '');
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).replace(/_/g, ' ');
}

function parseProperties(feature) {
  const p = feature?.properties || {};
  const raw = p.datasource?.raw || {};

  return {
    geoapifyId: p.place_id || null,
    name: p.name || 'Unnamed',
    amenity: p.categories?.[0] || null,
    allCategories: Array.isArray(p.categories) ? p.categories : [],
    address: {
      full: p.formatted || null,
      street: p.street || null,
      houseNumber: p.housenumber || null,
      suburb: p.suburb || null,
      district: p.district || null,
      city: p.city || null,
      state: p.state || null,
      postcode: p.postcode || null,
      country: p.country || null,
    },
    phone: raw.phone || p.contact?.phone || null,
    website: raw.website || p.contact?.website || null,
    email: raw.email || p.contact?.email || null,
    openingHours: {
      raw: raw.opening_hours || null,
      weekday: raw['opening_hours:weekday'] || null,
      weekend: raw['opening_hours:weekend'] || null,
    },
    cuisine: raw.cuisine || null,
    diet: raw.diet || null,
    takeaway: raw.takeaway || null,
    delivery: raw.delivery || null,
    dineIn: raw.dine_in || null,
    outdoor: raw.outdoor_seating || null,
    wheelchair: raw.wheelchair || null,
    priceRange: raw.price_range || null,
    smokingPolicy: raw.smoking || null,
    rating: p.rating || null,
    reviewCount: p.reviews_count || null,
    osmId: raw.osm_id || null,
    osmType: raw.osm_type || null,
  };
}

exports.getNearby = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    let radius = Number.parseInt(req.query.radius, 10);
    radius = Math.min(Math.max(radius, 100), 5000); // Geoapify hard limit is 5000m
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '50', 10) || 50, 1), 500);

    if (
      req.query.lat === undefined ||
      req.query.lng === undefined ||
      req.query.radius === undefined ||
      Number.isNaN(lat) ||
      Number.isNaN(lng) ||
      Number.isNaN(radius)
    ) {
      return res.status(400).json({ error: 'Validation failed: lat, lng, radius are required' });
    }

    const cacheKey = `geo:restaurants:${parseFloat(lat).toFixed(3)}:${parseFloat(lng).toFixed(3)}:${Math.round(radius / 100) * 100}`;

    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return res.status(200).json(parsed);
      }
    }

    let response;
    try {
      response = await axios.get('https://api.geoapify.com/v2/places', {
        params: {
          categories: 'catering.restaurant,catering.cafe,catering.fast_food,catering.food_court',
          filter: `circle:${lng},${lat},${radius}`,
          limit,
          apiKey: GEOAPIFY_API_KEY,
        },
        headers: {
          'Accept-Encoding': 'gzip',
        },
        timeout: 15000,
        validateStatus: () => true,
      });
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return res.status(503).json({ error: true, message: 'Geoapify request timed out' });
      }
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }

    if (response.status === 401) {
      return res.status(500).json({ error: true, message: 'Geoapify API key is invalid or restricted (Not Allowed). Check your Geoapify dashboard for IP/Domain restrictions.' });
    }

    if (response.status === 429) {
      return res.status(429).json({ error: true, message: 'Rate limit hit, try again shortly' });
    }

    if (response.status !== 200) {
      return res.status(response.status).json({ error: true, message: 'Geoapify request failed', details: response.data });
    }

    const features = Array.isArray(response.data?.features) ? response.data.features : [];

    const places = features.map(parseProperties).filter((place) => place.geoapifyId);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(places), { ex: 86400 });
    }

    return res.status(200).json(places);
  } catch (error) {
    return res.status(500).json({ error: true, message: 'Internal server error' });
  }
};
