const express = require('express');
const router = express.Router();
const { dashboardController } = require('../controllers');
const { authenticate, studentOnly, teacherOnly } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Dashboard routes
router.get('/student', studentOnly, dashboardController.getStudentDashboard);
router.get('/teacher', teacherOnly, dashboardController.getTeacherDashboard);
router.get('/stats', dashboardController.getStats);

module.exports = router;
