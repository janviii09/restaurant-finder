const express = require('express');
const router = express.Router();
const { getReviews, addReview, updateReview, deleteReview } = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.get('/:restaurantId', getReviews);
router.post('/:restaurantId', auth, addReview);
router.put('/:reviewId', auth, updateReview);
router.delete('/:reviewId', auth, deleteReview);

module.exports = router;
