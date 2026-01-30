const express = require('express');
const router = express.Router();
const { teamController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  studentOnly,
  teamValidators,
  commonValidators,
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Get user's teams
router.get('/', teamController.getMyTeams);

// Create team (student only)
router.post('/', studentOnly, teamValidators.create, teamController.createTeam);

// Team by ID routes
router.get('/:id', commonValidators.mongoId, teamController.getTeam);
router.put('/:id', commonValidators.mongoId, teamValidators.update, teamController.updateTeam);
router.delete('/:id', commonValidators.mongoId, teamController.deleteTeam);

// Member management
router.post('/:id/members', commonValidators.mongoId, teamController.addMember);
router.delete('/:id/members/:memberId', teamController.removeMember);
router.post('/:id/leave', commonValidators.mongoId, teamController.leaveTeam);
router.put('/:id/transfer-leadership', commonValidators.mongoId, teamController.transferLeadership);

// Join requests
router.post('/:id/join-request', commonValidators.mongoId, teamController.requestToJoin);
router.delete('/:id/join-request', commonValidators.mongoId, teamController.cancelJoinRequest);
router.get('/:id/join-requests', commonValidators.mongoId, teamController.getJoinRequests);
router.put('/:id/join-requests/:requestId', commonValidators.mongoId, teamController.processJoinRequest);

// Submission
router.post('/:id/submit', commonValidators.mongoId, teamController.submitWork);
router.post('/:id/final-submit', commonValidators.mongoId, teamController.finalSubmit);

// Evaluation (teacher only)
router.post('/:id/evaluate', teacherOnly, commonValidators.mongoId, teamValidators.evaluate, teamController.evaluateTeam);
router.post('/:id/lock-evaluation', teacherOnly, commonValidators.mongoId, teamController.lockEvaluation);

module.exports = router;
