const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateTokenFamily,
  getRefreshExpiry,
} = require('../utils/token');
const { NODE_ENV } = require('../config/env');

// ─── Cookie options for refresh token ─────────────────────────────
const REFRESH_COOKIE_NAME = 'rf_refresh';

function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: NODE_ENV === 'production',        // HTTPS only in prod
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/auth',                         // Only sent to auth routes
    maxAge: 7 * 24 * 60 * 60 * 1000,          // 7 days
  };
}

// ─── Helper: issue token pair & set cookie ────────────────────────
async function issueTokenPair(user, res, family = null) {
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const rawRefresh = signRefreshToken({ id: user._id });

  // Create or continue a token family
  const tokenFamily = family || generateTokenFamily();

  // Store hashed refresh token in DB
  await RefreshToken.create({
    tokenHash: RefreshToken.hashToken(rawRefresh),
    user: user._id,
    family: tokenFamily,
    expiresAt: getRefreshExpiry(),
  });

  // Set refresh token as HttpOnly cookie
  res.cookie(REFRESH_COOKIE_NAME, rawRefresh, getRefreshCookieOptions());

  return accessToken;
}

// ═══════════════════════════════════════════════════════════════════
//  REGISTER
// ═══════════════════════════════════════════════════════════════════
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, college } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: 409,
        error: 'An account with this email already exists.',
      });
    }

    // Create user (password is hashed by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      college: college || 'Other',
    });

    // Issue tokens
    const accessToken = await issueTokenPair(user, res);

    res.status(201).json({
      status: 201,
      message: 'Registration successful',
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════════
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user WITH password field (it's excluded by default via select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 401,
        error: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 403,
        error: 'Your account has been deactivated. Contact support.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        error: 'Invalid email or password.',
      });
    }

    // Issue tokens
    const accessToken = await issueTokenPair(user, res);

    res.json({
      status: 200,
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  REFRESH — Token rotation with reuse detection
// ═══════════════════════════════════════════════════════════════════
exports.refresh = async (req, res, next) => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];

    if (!rawToken) {
      return res.status(401).json({
        status: 401,
        error: 'No refresh token provided.',
      });
    }

    // 1. Verify the JWT signature
    let decoded;
    try {
      decoded = verifyRefreshToken(rawToken);
    } catch (err) {
      // Clear invalid cookie
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return res.status(401).json({
        status: 401,
        error: 'Invalid or expired refresh token.',
      });
    }

    // 2. Find the stored token by hash
    const tokenHash = RefreshToken.hashToken(rawToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    // 3. Token not found — might have been revoked
    if (!storedToken) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return res.status(401).json({
        status: 401,
        error: 'Refresh token not recognized. Please login again.',
      });
    }

    // 4. ★ REUSE DETECTION — if token is already revoked, an attacker
    //    is replaying a stolen token. Revoke the ENTIRE family.
    if (storedToken.isRevoked) {
      console.warn(
        `⚠️  Refresh token reuse detected! Revoking family "${storedToken.family}" for user ${storedToken.user}`
      );

      await RefreshToken.revokeFamily(storedToken.family);
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

      return res.status(401).json({
        status: 401,
        error: 'Suspicious activity detected. All sessions revoked. Please login again.',
      });
    }

    // 5. Revoke the current token (single-use)
    storedToken.isRevoked = true;
    await storedToken.save();

    // 6. Fetch user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      await RefreshToken.revokeFamily(storedToken.family);
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

      return res.status(401).json({
        status: 401,
        error: 'User not found or deactivated.',
      });
    }

    // 7. Issue new token pair in the SAME family (rotation)
    const accessToken = await issueTokenPair(user, res, storedToken.family);

    res.json({
      status: 200,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  LOGOUT — Revoke token family
// ═══════════════════════════════════════════════════════════════════
exports.logout = async (req, res, next) => {
  try {
    const rawToken = req.cookies[REFRESH_COOKIE_NAME];

    if (rawToken) {
      const tokenHash = RefreshToken.hashToken(rawToken);
      const storedToken = await RefreshToken.findOne({ tokenHash });

      if (storedToken) {
        // Revoke the entire family so no other token in the chain works
        await RefreshToken.revokeFamily(storedToken.family);
      }
    }

    // Clear cookie regardless
    res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());

    res.json({
      status: 200,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  GET ME — Current user profile
// ═══════════════════════════════════════════════════════════════════
exports.getMe = async (req, res) => {
  res.json({
    status: 200,
    user: req.user.toJSON(),
  });
};
