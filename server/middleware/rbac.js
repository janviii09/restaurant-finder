/**
 * Middleware: Role-Based Access Control (RBAC).
 * Must be used AFTER the `auth` middleware (requires `req.user`).
 *
 * Usage:
 *   router.post('/admin-only', auth, authorize('admin'), handler)
 *   router.put('/owner-or-admin', auth, authorize('owner', 'admin'), handler)
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 401,
        error: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 403,
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}

module.exports = authorize;
