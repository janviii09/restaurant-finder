const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ─── Embedded OSM data (no ObjectId reference) ──────────
    osm_id: {
      type: String,
      required: [true, 'OSM ID is required'],
    },

    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },

    lat: {
      type: Number,
      required: true,
    },

    lon: {
      type: Number,
      required: true,
    },

    cuisine: {
      type: String,
      default: '',
    },

    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One bookmark per user per OSM place
bookmarkSchema.index({ user: 1, osm_id: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
