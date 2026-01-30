const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, authValidators, authLimiter } = require('../middleware');

// Public routes
router.post('/register', authLimiter, authValidators.register, authController.register);
router.post('/login', authLimiter, authValidators.login, authController.login);
router.post('/refresh', authValidators.refreshToken, authController.refreshAccessToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
