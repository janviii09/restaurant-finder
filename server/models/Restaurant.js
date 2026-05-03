const mongoose = require('mongoose');

// ─── Sub-schemas ─────────────────────────────────────────────────
const operatingHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: true,
    },
    open: { type: String, required: true },  // "09:00"
    close: { type: String, required: true }, // "23:00"
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },       // Cloudinary full-res URL
    thumbUrl: { type: String, default: '' },     // Cloudinary transformed thumb
    blurHash: { type: String, default: '' },     // BlurHash string for placeholder
    publicId: { type: String, default: '' },     // Cloudinary public_id for deletion
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

// ─── Main Restaurant Schema ─────────────────────────────────────
const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ─── GeoJSON Point (2dsphere indexed) ──────────────────────
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number],        // [longitude, latitude]
        required: [true, 'Coordinates are required'],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&  // lng
              coords[1] >= -90 && coords[1] <= 90        // lat
            );
          },
          message: 'Coordinates must be [longitude, latitude] with valid ranges',
        },
      },
    },

    address: {
      street: { type: String, default: '' },
      area: { type: String, default: '' },        // "Sector 62", "Sector 128"
      city: { type: String, default: 'Noida' },
      pincode: { type: String, default: '' },
    },

    // ─── Filterable facets ─────────────────────────────────────
    cuisine: {
      type: [String],
      default: [],
      index: true,
    },

    costForTwo: {
      type: Number,
      min: [0, 'Cost cannot be negative'],
      default: 0,
    },

    pureVeg: {
      type: Boolean,
      default: false,
    },

    hasDelivery: {
      type: Boolean,
      default: false,
    },

    hasSeating: {
      type: Boolean,
      default: false,
    },

    hasTakeaway: {
      type: Boolean,
      default: true,
    },

    // ─── Media ─────────────────────────────────────────────────
    images: [imageSchema],

    // ─── Denormalized ratings (updated by review hooks) ────────
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (v) => Math.round(v * 10) / 10, // Round to 1 decimal
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ─── Operating details ─────────────────────────────────────
    operatingHours: [operatingHoursSchema],
    phone: { type: String, default: '' },
    website: { type: String, default: '' },

    // ─── Admin approval workflow ───────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected', 'soft-deleted'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ═══════════════════════════════════════════════════════════════════
//  INDEXES
// ═══════════════════════════════════════════════════════════════════

// ★ 2dsphere geospatial index — enables $near, $geoWithin queries
restaurantSchema.index({ location: '2dsphere' });

// Compound text index for full-text search across name + description + cuisine
restaurantSchema.index(
  { name: 'text', description: 'text', cuisine: 'text' },
  {
    weights: { name: 10, cuisine: 5, description: 1 },
    name: 'restaurant_text_search',
  }
);

// Compound index for common filter + sort patterns
restaurantSchema.index({ status: 1, avgRating: -1 });
restaurantSchema.index({ status: 1, costForTwo: 1 });

// ═══════════════════════════════════════════════════════════════════
//  PRE-VALIDATE: auto-generate slug
// ═══════════════════════════════════════════════════════════════════
restaurantSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString(36);
  }
  next();
});

// ═══════════════════════════════════════════════════════════════════
//  VIRTUALS
// ═══════════════════════════════════════════════════════════════════
restaurantSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'restaurant',
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
