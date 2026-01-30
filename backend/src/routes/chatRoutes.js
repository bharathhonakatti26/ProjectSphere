const express = require('express');
const router = express.Router();
const { chatController } = require('../controllers');
const { authenticate, chatValidators, commonValidators } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Chat rooms
router.get('/rooms', chatController.getChatRooms);
router.get('/rooms/:id', commonValidators.mongoId, chatController.getChatRoom);

// Messages
router.get('/rooms/:id/messages', commonValidators.mongoId, chatController.getMessages);
router.post('/rooms/:id/messages', commonValidators.mongoId, chatValidators.sendMessage, chatController.sendMessage);

// Direct messages
router.post('/direct', chatValidators.createDirectMessage, chatController.createDirectMessage);

// Team chats
router.post('/team-review/:teamId', chatController.createTeamReviewChat);
router.get('/team-internal/:teamId', chatController.getTeamInternalChat);

// Project chat
router.get('/project/:projectId', chatController.getProjectChat);

// Classroom chat
router.get('/classroom/:classroomId', chatController.getClassroomChat);

// Message actions
router.put('/messages/:id', commonValidators.mongoId, chatValidators.sendMessage, chatController.editMessage);
router.delete('/messages/:id', commonValidators.mongoId, chatController.deleteMessage);

module.exports = router;
