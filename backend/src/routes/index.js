const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const classroomRoutes = require('./classroomRoutes');
const teamRoutes = require('./teamRoutes');
const projectRoutes = require('./projectRoutes');
const chatRoutes = require('./chatRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classrooms', classroomRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
