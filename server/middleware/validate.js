const { validationResult } = require('express-validator');

/**
 * Middleware: Run express-validator checks and return 422 on failures.
 * Place AFTER your validation chain array.
 *
 * Usage:
 *   router.post('/register', registerRules, validate, controller)
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors as { field: message }
    const formatted = errors.array().reduce((acc, err) => {
      const field = err.path || err.param || 'unknown';
      if (!acc[field]) {
        acc[field] = err.msg;
      }
      return acc;
    }, {});

    return res.status(422).json({
      status: 422,
      error: 'Validation failed',
      details: formatted,
    });
  }

  next();
}

module.exports = validate;
