const express = require('express');
const router = express.Router();
const { projectController } = require('../controllers');
const {
  authenticate,
  optionalAuth,
  projectValidators,
  commonValidators,
} = require('../middleware');

// Public routes
router.get('/public', optionalAuth, projectController.getPublicProjects);

// Protected routes
router.use(authenticate);

// CRUD
router.post('/', projectValidators.create, projectController.createProject);
router.get('/', projectController.getMyProjects);
router.get('/:id', commonValidators.mongoId, projectController.getProject);
router.put('/:id', commonValidators.mongoId, projectValidators.update, projectController.updateProject);
router.delete('/:id', commonValidators.mongoId, projectController.deleteProject);

// Member management
router.post('/:id/members', commonValidators.mongoId, projectController.addMember);
router.delete('/:id/members/:memberId', projectController.removeMember);
router.put('/:id/members/:memberId/role', projectController.updateMemberRole);
router.post('/:id/leave', commonValidators.mongoId, projectController.leaveProject);

// Mentors
router.post('/:id/mentors', commonValidators.mongoId, projectController.addMentor);

// Join requests
router.post('/:id/join-request', commonValidators.mongoId, projectController.requestToJoin);
router.get('/:id/join-requests', commonValidators.mongoId, projectController.getJoinRequests);
router.put('/:id/join-request/:requestId', projectController.processJoinRequest);

module.exports = router;
