const express = require('express');
const router = express.Router();

const restaurantController = require('../controllers/restaurantController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { uploadRestaurantImages, processImages } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  addRestaurantRules,
  updateRestaurantRules,
  nearbyQueryRules,
} = require('../validators/restaurantValidators');

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════

// GET /api/restaurants — Nearby restaurants with geospatial query
//   Query: ?lat=28.62&lng=77.36&radius=2000&cuisine=Chinese&sortBy=rating
router.get(
  '/',
  nearbyQueryRules,
  validate,
  restaurantController.getNearby
);

// GET /api/restaurants/:slug — Single restaurant by slug
router.get('/:slug', restaurantController.getBySlug);

// ═══════════════════════════════════════════════════════════════════
//  PROTECTED ROUTES — require authentication
// ═══════════════════════════════════════════════════════════════════

// POST /api/restaurants — Add a new restaurant (Owner, Admin)
router.post(
  '/',
  auth,
  authorize('owner', 'admin'),
  uploadLimiter,
  uploadRestaurantImages,
  processImages,
  addRestaurantRules,
  validate,
  restaurantController.addRestaurant
);

// PUT /api/restaurants/:id — Edit a restaurant (Owner of listing, Admin)
router.put(
  '/:id',
  auth,
  authorize('owner', 'admin'),
  uploadLimiter,
  uploadRestaurantImages,
  processImages,
  updateRestaurantRules,
  validate,
  restaurantController.updateRestaurant
);

// PATCH /api/restaurants/:id/approve — Admin only
router.patch(
  '/:id/approve',
  auth,
  authorize('admin'),
  restaurantController.approveRestaurant
);

// PATCH /api/restaurants/:id/reject — Admin only
router.patch(
  '/:id/reject',
  auth,
  authorize('admin'),
  restaurantController.rejectRestaurant
);

// DELETE /api/restaurants/:id — Soft-delete (Owner, Admin)
router.delete(
  '/:id',
  auth,
  authorize('owner', 'admin'),
  restaurantController.softDelete
);

// DELETE /api/restaurants/:id/images/:imageIndex — Remove image (Owner, Admin)
router.delete(
  '/:id/images/:imageIndex',
  auth,
  authorize('owner', 'admin'),
  restaurantController.removeImage
);

module.exports = router;
