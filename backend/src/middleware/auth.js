const { verifyAccessToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Authenticate user via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw unauthorized('Access token is required');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      throw unauthorized('Invalid or expired access token');
    }

    // Get user from database
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw unauthorized('User not found');
    }

    if (!user.isActive || user.isDeleted) {
      throw unauthorized('Account is deactivated');
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);

      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive && !user.isDeleted) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Authorize by role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    if (!roles.includes(req.userRole)) {
      return next(forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};

/**
 * Authorize student only
 */
const studentOnly = authorize('STUDENT');

/**
 * Authorize teacher only
 */
const teacherOnly = authorize('TEACHER');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  studentOnly,
  teacherOnly,
};
