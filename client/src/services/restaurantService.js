import api from './api';

/**
 * Fetch restaurants near a given coordinate.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in meters (default 2000)
 * @param {Object} filters - Additional filter params
 * @returns {Promise<Array>} Array of restaurant objects
 */
export async function fetchNearbyRestaurants(lat, lng, radius = 2000, filters = {}) {
  const params = {
    lat,
    lng,
    radius,
    ...filters,
  };

  const { data } = await api.get('/restaurants', { params });
  return data.restaurants || [];
}

/**
 * Fetch a single restaurant by slug.
 */
export async function fetchRestaurantBySlug(slug) {
  const { data } = await api.get(`/restaurants/${slug}`);
  return data.restaurant;
}

/**
 * Search restaurants by text query + filters.
 */
export async function searchRestaurants(query, filters = {}) {
  const params = { q: query, ...filters };
  const { data } = await api.get('/restaurants/search', { params });
  return data;
}

/**
 * Add a new restaurant (owner/admin).
 */
export async function addRestaurant(formData, accessToken) {
  const { data } = await api.post('/restaurants', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data.restaurant;
}

/**
 * Update a restaurant.
 */
export async function updateRestaurant(id, formData, accessToken) {
  const { data } = await api.put(`/restaurants/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return data.restaurant;
}

export default {
  fetchNearbyRestaurants,
  fetchRestaurantBySlug,
  searchRestaurants,
  addRestaurant,
  updateRestaurant,
};
