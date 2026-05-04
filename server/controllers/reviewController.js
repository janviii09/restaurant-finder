const Review = require('../models/Review');

exports.getReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const reviews = await Review.find({ restaurantId }).populate('user', 'name').sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

    res.json({
      reviews,
      totalReviews,
      averageRating: Number(averageRating.toFixed(1))
    });
} catch (err) {
  next(err);
}
};

exports.addReview = async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Comment must be 500 characters or less' });
    }

    const existing = await Review.findOne({ restaurantId, user: userId });
    if (existing) {
      return res.status(400).json({ error: 'You have already reviewed this restaurant' });
    }

    const review = await Review.create({
      restaurantId,
      user: userId,
      rating,
      comment
    });

    await review.populate('user', 'name');
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already reviewed this restaurant' });
    }
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId || req.user.id || req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to modify this review' });
    }

    if (rating) {
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      review.rating = rating;
    }
    if (comment !== undefined) {
      if (comment.length > 500) return res.status(400).json({ error: 'Comment must be 500 characters or less' });
      review.comment = comment;
    }

    await review.save();
    await review.populate('user', 'name');
    res.json(review);
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.userId || req.user.id || req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    await review.deleteOne();
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
};
