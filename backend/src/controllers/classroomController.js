const asyncHandler = require('express-async-handler');
const { Classroom, Team, User } = require('../models');
const { ChatRoom } = require('../models/Chat');
const {
  ApiResponse,
  notFound,
  badRequest,
  forbidden,
  parsePagination,
} = require('../utils');

/**
 * @desc    Create classroom
 * @route   POST /api/classrooms
 * @access  Private (Teacher only)
 */
const createClassroom = asyncHandler(async (req, res) => {
  const { name, subject, description, semester, academicYear, department, settings } = req.body;

  const classroom = await Classroom.create({
    name,
    subject,
    description,
    semester,
    academicYear,
    department,
    settings,
    teacher: req.userId,
  });

  // Create classroom chat room
  await ChatRoom.findOrCreateClassroomChat(classroom._id);

  await classroom.populate('teacher', 'firstName lastName email avatar');

  return ApiResponse.created(res, { classroom }, 'Classroom created successfully');
});

/**
 * @desc    Get all classrooms for teacher
 * @route   GET /api/classrooms
 * @access  Private (Teacher only)
 */
const getTeacherClassrooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { archived } = req.query;

  const query = {
    teacher: req.userId,
    isDeleted: false,
  };

  if (archived === 'true') {
    query.isArchived = true;
  } else if (archived === 'false') {
    query.isArchived = false;
  }

  const [classrooms, total] = await Promise.all([
    Classroom.find(query)
      .populate('teacher', 'firstName lastName email avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Classroom.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, classrooms, { page, limit, total });
});

/**
 * @desc    Get classrooms for student
 * @route   GET /api/classrooms/enrolled
 * @access  Private (Student only)
 */
const getStudentClassrooms = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const query = {
    'students.user': req.userId,
    'students.status': 'ACTIVE',
    isDeleted: false,
    isArchived: false,
  };

  const [classrooms, total] = await Promise.all([
    Classroom.find(query)
      .populate('teacher', 'firstName lastName email avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Classroom.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, classrooms, { page, limit, total });
});

/**
 * @desc    Get single classroom
 * @route   GET /api/classrooms/:id
 * @access  Private
 */
const getClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false })
    .populate('teacher', 'firstName lastName email avatar')
    .populate('students.user', 'firstName lastName email avatar studentId');

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  // Check access
  const isTeacher = classroom.isTeacher(req.userId);
  const isStudent = classroom.isStudentMember(req.userId);

  if (!isTeacher && !isStudent) {
    throw forbidden('You do not have access to this classroom');
  }

  // Get teams for this classroom
  const teams = await Team.find({ classroom: classroom._id, isDeleted: false })
    .populate('leader', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar');

  return ApiResponse.success(res, { classroom, teams });
});

/**
 * @desc    Update classroom
 * @route   PUT /api/classrooms/:id
 * @access  Private (Teacher only)
 */
const updateClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can update this classroom');
  }

  const allowedFields = ['name', 'subject', 'description', 'semester', 'academicYear', 'department', 'settings'];
  
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      classroom[field] = req.body[field];
    }
  });

  await classroom.save();
  await classroom.populate('teacher', 'firstName lastName email avatar');

  return ApiResponse.success(res, { classroom }, 'Classroom updated successfully');
});

/**
 * @desc    Delete classroom
 * @route   DELETE /api/classrooms/:id
 * @access  Private (Teacher only)
 */
const deleteClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can delete this classroom');
  }

  await classroom.softDelete();

  return ApiResponse.success(res, null, 'Classroom deleted successfully');
});

/**
 * @desc    Archive classroom
 * @route   PUT /api/classrooms/:id/archive
 * @access  Private (Teacher only)
 */
const archiveClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can archive this classroom');
  }

  await classroom.archive();

  return ApiResponse.success(res, { classroom }, 'Classroom archived successfully');
});

/**
 * @desc    Join classroom by code
 * @route   POST /api/classrooms/join
 * @access  Private (Student only)
 */
const joinClassroomByCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const classroom = await Classroom.findByCode(code);

  if (!classroom) {
    throw notFound('Classroom not found with this code');
  }

  if (classroom.isArchived) {
    throw badRequest('This classroom is archived and not accepting new students');
  }

  if (classroom.isStudentMember(req.userId)) {
    throw badRequest('You are already a member of this classroom');
  }

  await classroom.addStudent(req.userId);
  await classroom.populate('teacher', 'firstName lastName email avatar');

  return ApiResponse.success(res, { classroom }, 'Joined classroom successfully');
});

/**
 * @desc    Leave classroom
 * @route   POST /api/classrooms/:id/leave
 * @access  Private (Student only)
 */
const leaveClassroom = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isStudentMember(req.userId)) {
    throw badRequest('You are not a member of this classroom');
  }

  const student = classroom.students.find(
    (s) => s.user.toString() === req.userId.toString()
  );
  student.status = 'LEFT';
  await classroom.save();

  return ApiResponse.success(res, null, 'Left classroom successfully');
});

/**
 * @desc    Remove student from classroom
 * @route   DELETE /api/classrooms/:id/students/:studentId
 * @access  Private (Teacher only)
 */
const removeStudent = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can remove students');
  }

  await classroom.removeStudent(req.params.studentId);

  return ApiResponse.success(res, null, 'Student removed from classroom');
});

/**
 * @desc    Get classroom students
 * @route   GET /api/classrooms/:id/students
 * @access  Private
 */
const getClassroomStudents = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false })
    .populate('students.user', 'firstName lastName email avatar studentId department');

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  const isTeacher = classroom.isTeacher(req.userId);
  const isStudent = classroom.isStudentMember(req.userId);

  if (!isTeacher && !isStudent) {
    throw forbidden('You do not have access to this classroom');
  }

  const activeStudents = classroom.students.filter((s) => s.status === 'ACTIVE');

  return ApiResponse.success(res, { students: activeStudents });
});

module.exports = {
  createClassroom,
  getTeacherClassrooms,
  getStudentClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
  archiveClassroom,
  joinClassroomByCode,
  leaveClassroom,
  removeStudent,
  getClassroomStudents,
};
