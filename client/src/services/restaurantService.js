import api from './api';

/**
 * Fetch restaurants near a given coordinate from Overpass-backed API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters (default 2000)
 * @param {Object} filters - Additional filter params (cuisine, pureVeg, delivery, q)
 * @returns {Promise<Array>} Array of OSM restaurant objects
 */
export async function fetchNearbyRestaurants(lat, lng, radius = 2000, filters = {}) {
  const params = {
    lat,
    lng,
    radius,
    ...filters,
  };

  const { data } = await api.get('/restaurants', { params });
  return Array.isArray(data) ? data : data.restaurants || [];
}

export default { fetchNearbyRestaurants };
