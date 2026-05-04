import api from './api';

// ─── Bookmarks (OSM embedded data) ────────────────────────────
export async function getBookmarks(accessToken) {
  const { data } = await api.get('/users/bookmarks', { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

export async function addBookmark(restaurant, accessToken) {
  const { data } = await api.post('/users/bookmarks', {
    geoapifyId: restaurant.geoapifyId,
    name: restaurant.name,
    cuisine: restaurant.cuisine || '',
  }, { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

export async function removeBookmark(id, accessToken) {
  const { data } = await api.delete(`/users/bookmarks/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

// ─── Profile ──────────────────────────────────────────────────
export async function updateProfile(updates, accessToken) {
  const { data } = await api.put('/users/profile', updates, { headers: { Authorization: `Bearer ${accessToken}` } });
  return data;
}

export default {
  getBookmarks, addBookmark, removeBookmark, updateProfile,
};
