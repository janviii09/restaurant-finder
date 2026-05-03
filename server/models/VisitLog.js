const mongoose = require('mongoose');

const visitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },

    visitedAt: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying a user's visit history sorted by date
visitLogSchema.index({ user: 1, visitedAt: -1 });

module.exports = mongoose.model('VisitLog', visitLogSchema);
