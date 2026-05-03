const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/restaurants — Nearby restaurants (Overpass-backed, Redis-cached)
//   Query: ?lat=28.62&lng=77.36&radius=2000&cuisine=indian&pureVeg=true&q=pizza
router.get('/', restaurantController.getNearby);

module.exports = router;
