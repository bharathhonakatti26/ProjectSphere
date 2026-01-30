const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { authenticate, teacherOnly, userValidators, commonValidators } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', (req, res) => userController.getUserProfile({ ...req, params: { id: req.userId } }, res));
router.put('/profile', userValidators.updateProfile, userController.updateProfile);
router.put('/change-password', userValidators.changePassword, userController.changePassword);
router.delete('/account', userController.deactivateAccount);

// Search & list routes
router.get('/search', userController.searchUsers);
router.get('/teachers', userController.getTeachers);
router.get('/students', teacherOnly, userController.getStudents);

// Get user by ID
router.get('/:id', commonValidators.mongoId, userController.getUserProfile);

module.exports = router;
