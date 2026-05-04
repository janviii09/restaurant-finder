const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bookmarkSchema = new mongoose.Schema(
  {
    geoapifyId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    amenity: { type: String, default: null },
    cuisine: { type: String, default: null },
    lat: { type: Number, required: false },
    lon: { type: Number, required: false },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never returned in queries by default
    },

    bookmarks: {
      type: [bookmarkSchema],
      default: [],
    },

    role: {
      type: String,
      enum: {
        values: ['student', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'student',
    },

    avatar: {
      type: String,
      default: '',
    },

    college: {
      type: String,
      enum: ['JIIT-62', 'JIIT-128', 'Other'],
      default: 'Other',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────

// ─── Instance methods ────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Strip password hash from JSON output.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
