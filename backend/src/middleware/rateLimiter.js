const rateLimit = require('express-rate-limit');
const config = require('../config');

// Skip rate limiting in development
const skipInDev = () => config.nodeEnv === 'development';

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

/**
 * Strict rate limiter for auth routes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window (increased for development)
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

/**
 * API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute (increased for development)
  message: {
    success: false,
    message: 'API rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
});

module.exports = {
  generalLimiter,
  authLimiter,
  apiLimiter,
};
