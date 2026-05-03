const express = require('express');
const router = express.Router();

const geocodeController = require('../controllers/geocodeController');
const { geocodeLimiter } = require('../middleware/rateLimiter');

// Rate-limited to 1 req/sec to respect Nominatim usage policy
router.use(geocodeLimiter);

// GET /api/geocode/reverse?lat=28.62&lng=77.36
router.get('/reverse', geocodeController.reverse);

// GET /api/geocode/forward?q=JIIT+Sector+62
router.get('/forward', geocodeController.forward);

module.exports = router;
