import api from './api';

/**
 * Register a new user.
 */
export async function register({ name, email, password }) {
  const { data } = await api.post('/auth/register', {
    name,
    email,
    password,
  });
  return data;
}

/**
 * Login with email and password.
 * Refresh token is set as HttpOnly cookie automatically.
 */
export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

/**
 * Refresh the access token using the HttpOnly refresh cookie.
 */
export async function refreshAccessToken() {
  const { data } = await api.post('/auth/refresh');
  return data;
}

/**
 * Logout — revoke refresh token.
 */
export async function logout() {
  await api.post('/auth/logout');
}

/**
 * Get current user profile (requires access token).
 */
export async function getMe(accessToken) {
  const { data } = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

export default {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
};
