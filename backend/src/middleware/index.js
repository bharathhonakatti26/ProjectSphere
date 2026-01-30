const { authenticate, optionalAuth, authorize, studentOnly, teacherOnly } = require('./auth');
const { errorConverter, errorHandler, notFoundHandler } = require('./errorHandler');
const { generalLimiter, authLimiter, apiLimiter } = require('./rateLimiter');
const validators = require('./validators');

module.exports = {
  // Auth
  authenticate,
  optionalAuth,
  authorize,
  studentOnly,
  teacherOnly,

  // Error handling
  errorConverter,
  errorHandler,
  notFoundHandler,

  // Rate limiting
  generalLimiter,
  authLimiter,
  apiLimiter,

  // Validators
  ...validators,
};
