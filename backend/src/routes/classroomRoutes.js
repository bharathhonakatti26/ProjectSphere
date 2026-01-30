const express = require('express');
const router = express.Router();
const { classroomController, teamController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  studentOnly,
  classroomValidators,
  commonValidators,
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Teacher routes
router.post('/', teacherOnly, classroomValidators.create, classroomController.createClassroom);
router.get('/', teacherOnly, classroomController.getTeacherClassrooms);

// Student routes
router.get('/enrolled', studentOnly, classroomController.getStudentClassrooms);
router.post('/join', studentOnly, classroomValidators.joinByCode, classroomController.joinClassroomByCode);

// Classroom by ID routes
router.get('/:id', commonValidators.mongoId, classroomController.getClassroom);
router.put('/:id', teacherOnly, commonValidators.mongoId, classroomValidators.update, classroomController.updateClassroom);
router.delete('/:id', teacherOnly, commonValidators.mongoId, classroomController.deleteClassroom);
router.put('/:id/archive', teacherOnly, commonValidators.mongoId, classroomController.archiveClassroom);

// Student management
router.get('/:id/students', commonValidators.mongoId, classroomController.getClassroomStudents);
router.post('/:id/leave', studentOnly, commonValidators.mongoId, classroomController.leaveClassroom);
router.delete('/:id/students/:studentId', teacherOnly, classroomController.removeStudent);

// Teams within classroom
router.get('/:classroomId/teams', teamController.getTeamsByClassroom);

// Export evaluations
router.get('/:id/export', teacherOnly, commonValidators.mongoId, teamController.exportEvaluations);

module.exports = router;
