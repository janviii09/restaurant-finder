const { reverseGeocode, forwardGeocode } = require('../services/nominatimService');

/**
 * GET /api/geocode/reverse?lat=28.62&lng=77.36
 * Reverse geocode coordinates → address.
 */
exports.reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 400,
        error: 'Both "lat" and "lng" query parameters are required.',
      });
    }

    const result = await reverseGeocode(lat, lng);

    res.json({
      status: 200,
      address: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/geocode/forward?q=JIIT+Sector+62
 * Forward geocode address text → coordinates.
 */
exports.forward = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        status: 400,
        error: 'Query parameter "q" is required.',
      });
    }

    const result = await forwardGeocode(q);

    if (!result) {
      return res.status(404).json({
        status: 404,
        error: 'No results found for the given address.',
      });
    }

    res.json({
      status: 200,
      location: result,
    });
  } catch (err) {
    next(err);
  }
};
