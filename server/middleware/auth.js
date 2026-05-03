const { verifyAccessToken } = require('../utils/token');
const User = require('../models/User');

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches `req.user` with the full user document (minus password).
 *
 * Usage: router.get('/protected', auth, handler)
 */
async function auth(req, res, next) {
  try {
    // 1. Extract token from "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 401,
        error: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError'
          ? 'Access token expired. Please refresh.'
          : 'Invalid access token.';

      return res.status(401).json({ status: 401, error: message });
    }

    // 3. Fetch user (ensure they still exist and are active)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 401,
        error: 'User belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 403,
        error: 'Your account has been deactivated.',
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
