const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
} = require('../config/env');

/**
 * Sign an access token (short-lived, in-memory on client).
 * @param {{ id: string, role: string }} payload
 * @returns {string} JWT
 */
function signAccessToken(payload) {
  return jwt.sign(
    { id: payload.id, role: payload.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
}

/**
 * Sign a refresh token (long-lived, stored in HttpOnly cookie).
 * @param {{ id: string }} payload
 * @returns {string} JWT
 */
function signRefreshToken(payload) {
  return jwt.sign(
    { id: payload.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Generate a unique token family ID for refresh token rotation.
 * @returns {string} UUID-like family identifier
 */
function generateTokenFamily() {
  return crypto.randomUUID();
}

/**
 * Parse JWT_REFRESH_EXPIRY string (e.g. "7d") into milliseconds.
 * Supports: "Xd" (days), "Xh" (hours), "Xm" (minutes).
 * @param {string} expiry
 * @returns {number} milliseconds
 */
function parseExpiryToMs(expiry) {
  const match = expiry.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Calculate refresh token expiration Date from now.
 * @returns {Date}
 */
function getRefreshExpiry() {
  return new Date(Date.now() + parseExpiryToMs(JWT_REFRESH_EXPIRY));
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenFamily,
  getRefreshExpiry,
};
