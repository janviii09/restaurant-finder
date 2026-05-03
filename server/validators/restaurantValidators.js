const { body, param, query } = require('express-validator');

const addRestaurantRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Restaurant name is required')
    .isLength({ max: 120 }).withMessage('Name cannot exceed 120 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('longitude')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  body('latitude')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  body('address.street').optional().trim(),
  body('address.area').optional().trim(),
  body('address.city').optional().trim(),
  body('address.pincode').optional().trim(),

  body('cuisine')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
      if (Array.isArray(value)) return value;
      return [];
    }),

  body('costForTwo')
    .optional()
    .isInt({ min: 0 }).withMessage('Cost for two must be a positive number')
    .toInt(),

  body('pureVeg').optional().isBoolean().toBoolean(),
  body('hasDelivery').optional().isBoolean().toBoolean(),
  body('hasSeating').optional().isBoolean().toBoolean(),
  body('hasTakeaway').optional().isBoolean().toBoolean(),

  body('phone').optional().trim(),
  body('website').optional().trim().isURL().withMessage('Invalid website URL'),

  body('operatingHours')
    .optional()
    .customSanitizer((value) => {
      if (typeof value === 'string') {
        try { return JSON.parse(value); } catch { return []; }
      }
      return value || [];
    }),
];

const updateRestaurantRules = [
  param('id').isMongoId().withMessage('Invalid restaurant ID'),
  ...addRestaurantRules.map((rule) => {
    // Make all fields optional for updates
    return rule;
  }),
];

const nearbyQueryRules = [
  query('lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

  query('lng')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

  query('radius')
    .optional()
    .isInt({ min: 100, max: 10000 }).withMessage('Radius must be between 100 and 10000 meters')
    .toInt(),

  query('cuisine').optional().trim(),
  query('maxCost').optional().isInt({ min: 0 }).toInt(),
  query('pureVeg').optional().isBoolean().toBoolean(),
  query('hasDelivery').optional().isBoolean().toBoolean(),
  query('hasSeating').optional().isBoolean().toBoolean(),
  query('sortBy').optional().isIn(['distance', 'rating', 'costForTwo']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order'),
  query('q').optional().trim(),
];

module.exports = {
  addRestaurantRules,
  updateRestaurantRules,
  nearbyQueryRules,
};
