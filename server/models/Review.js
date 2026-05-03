const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant reference is required'],
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },

    text: {
      type: String,
      maxlength: [2000, 'Review text cannot exceed 2000 characters'],
      default: '',
    },

    photos: [
      {
        url: { type: String, required: true },
        thumbUrl: { type: String, default: '' },
        publicId: { type: String, default: '' }, // Cloudinary public_id
      },
    ],

    // ─── Abuse-resistant voting ────────────────────────────────
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    score: {
      type: Number,
      default: 0,
    },

    // ─── Moderation / Report queue ─────────────────────────────
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        reason: {
          type: String,
          enum: ['spam', 'offensive', 'fake', 'other'],
          required: true,
        },
        details: { type: String, maxlength: 500, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    isFlagged: {
      type: Boolean,
      default: false,
      index: true,
    },

    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Unique constraint: one review per user per restaurant ──────
reviewSchema.index({ restaurant: 1, user: 1 }, { unique: true });

// ─── Pre-save: auto-flag when 3+ reports ────────────────────────
reviewSchema.pre('save', function (next) {
  // Recalculate score
  this.score = this.upvotes.length - this.downvotes.length;

  // Auto-flag if 3 or more reports
  if (this.reports.length >= 3 && !this.isFlagged) {
    this.isFlagged = true;
  }

  next();
});

// ─── Static: recalculate restaurant average rating ──────────────
reviewSchema.statics.calcAverageRating = async function (restaurantId) {
  const stats = await this.aggregate([
    { $match: { restaurant: restaurantId, isHidden: false } },
    {
      $group: {
        _id: '$restaurant',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const Restaurant = mongoose.model('Restaurant');

  if (stats.length > 0) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      avgRating: stats[0].avgRating,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      avgRating: 0,
      totalReviews: 0,
    });
  }
};

// Post-save / post-remove: keep ratings in sync
reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.restaurant);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calcAverageRating(doc.restaurant);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
