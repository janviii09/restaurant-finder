const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerRules, loginRules } = require('../validators/authValidators');

// ─── Public routes ────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerRules, validate, authController.register);

// POST /api/auth/login
router.post('/login', loginRules, validate, authController.login);

// POST /api/auth/refresh — uses HttpOnly cookie, no auth header needed
router.post('/refresh', authController.refresh);

// ─── Protected routes ─────────────────────────────────────────────

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me — requires valid access token
router.get('/me', auth, authController.getMe);

module.exports = router;
