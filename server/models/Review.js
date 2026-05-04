const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// One review per user per restaurant
reviewSchema.index({ restaurantId: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
