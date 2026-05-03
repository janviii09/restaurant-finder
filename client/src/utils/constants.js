// API base URL — defaults to Vite proxy in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Default map center: JIIT Sector 62, Noida
export const DEFAULT_CENTER = {
  lat: 28.6285,
  lng: 77.3640,
};

// Map defaults
export const DEFAULT_ZOOM = 14;
export const MIN_RADIUS = 500;   // meters
export const MAX_RADIUS = 5000;  // meters
export const DEFAULT_RADIUS = 2000;

// Cuisine options for filter facets
export const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Fast Food',
  'Italian',
  'Street Food',
  'Biryani',
  'Momos',
  'Pizza',
  'Café',
  'Bakery',
  'Ice Cream',
  'Rolls',
  'Thali',
  'Other',
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'distance', label: 'Walk Time (nearest first)' },
  { value: 'rating', label: 'Avg Rating (highest first)' },
  { value: 'costForTwo', label: 'Cost for Two (lowest first)' },
];

// Roles
export const ROLES = {
  STUDENT: 'student',
  OWNER: 'owner',
  ADMIN: 'admin',
};

// Walk speed (average human walking speed in m/s)
export const WALK_SPEED_MS = 1.3; // ~4.7 km/h
