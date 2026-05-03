const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Middleware: Verify JWT access token from Authorization header.
 * Attaches `req.user` with the full user document (minus password).
 *
 * Usage: router.get('/protected', auth, handler)
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7).trim();
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = auth;
