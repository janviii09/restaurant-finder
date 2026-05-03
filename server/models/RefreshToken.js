const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the actual token (never store plaintext)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Token family for rotation & reuse detection
    // All tokens in a refresh chain share the same family ID.
    // If a used token is reused → revoke entire family.
    family: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // TTL index — MongoDB auto-deletes expired docs
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Static: hash a raw token for storage / comparison ──────────
refreshTokenSchema.statics.hashToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// ─── Static: revoke all tokens in a family (reuse detection) ────
refreshTokenSchema.statics.revokeFamily = async function (family) {
  await this.updateMany({ family }, { isRevoked: true });
};

// ─── Static: revoke all tokens for a user (logout everywhere) ───
refreshTokenSchema.statics.revokeAllForUser = async function (userId) {
  await this.updateMany({ user: userId }, { isRevoked: true });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
