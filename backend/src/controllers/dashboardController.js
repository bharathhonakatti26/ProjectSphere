const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { User, Classroom, Team, Project } = require('../models');
const { ApiResponse } = require('../utils');

/**
 * @desc    Get student dashboard
 * @route   GET /api/dashboard/student
 * @access  Private (Student only)
 */
const getStudentDashboard = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Ensure userId is valid
  if (!userId) {
    return ApiResponse.success(res, {
      classrooms: [],
      teams: [],
      projects: [],
      stats: { totalClassrooms: 0, totalTeams: 0, totalProjects: 0, completedProjects: 0 },
    });
  }

  // Get enrolled classrooms
  const classrooms = await Classroom.find({
    'students.user': userId,
    isDeleted: false,
    isArchived: false,
  })
    .populate('teacher', 'firstName lastName avatar')
    .select('name subject teacher students createdAt')
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();

  // Get teams
  const teams = await Team.find({
    'members.user': userId,
    isDeleted: false,
  })
    .populate('classroom', 'name')
    .populate('project', 'title status')
    .select('name classroom project members submission.status')
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();

  // Get projects
  const projects = await Project.find({
    $or: [
      { creator: userId },
      { 'members.user': userId },
    ],
    isDeleted: false,
  })
    .select('title status type visibility members createdAt')
    .limit(5)
    .sort({ updatedAt: -1 })
    .lean();

  // Stats - use simpler queries
  const [totalClassrooms, totalTeams, totalProjects, completedProjects] = await Promise.all([
    Classroom.countDocuments({
      'students.user': userId,
      isDeleted: false,
    }),
    Team.countDocuments({
      'members.user': userId,
      isDeleted: false,
    }),
    Project.countDocuments({
      $or: [
        { creator: userId },
        { 'members.user': userId },
      ],
      isDeleted: false,
    }),
    Project.countDocuments({
      $or: [
        { creator: userId },
        { 'members.user': userId },
      ],
      status: 'COMPLETED',
      isDeleted: false,
    }),
  ]);

  const stats = {
    totalClassrooms,
    totalTeams,
    totalProjects,
    completedProjects,
  };

  return ApiResponse.success(res, {
    classrooms,
    teams,
    projects,
    stats,
  });
});

/**
 * @desc    Get teacher dashboard
 * @route   GET /api/dashboard/teacher
 * @access  Private (Teacher only)
 */
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Ensure userId is valid
  if (!userId) {
    return ApiResponse.success(res, {
      classrooms: [],
      pendingEvaluations: [],
      mentoringProjects: [],
      stats: { totalClassrooms: 0, activeClassrooms: 0, totalStudents: 0, totalTeams: 0, pendingEvaluations: 0, mentoringProjects: 0 },
    });
  }

  // Get classrooms
  const classrooms = await Classroom.find({
    teacher: userId,
    isDeleted: false,
    isArchived: false,
  })
    .select('name subject students createdAt code')
    .limit(5)
    .sort({ createdAt: -1 })
    .lean();

  const classroomIds = classrooms.map((c) => c._id);

  // Get teams pending evaluation
  const pendingEvaluations = await Team.find({
    classroom: { $in: classroomIds },
    'submission.status': { $in: ['SUBMITTED', 'FINAL'] },
    'evaluation.isLocked': { $ne: true },
    isDeleted: false,
  })
    .populate('classroom', 'name')
    .select('name classroom submission.status evaluation.marks')
    .limit(10)
    .sort({ 'submission.submittedAt': -1 })
    .lean();

  // Get projects mentoring
  const mentoringProjects = await Project.find({
    'mentors.user': userId,
    isDeleted: false,
  })
    .select('title status type members createdAt')
    .limit(5)
    .sort({ updatedAt: -1 })
    .lean();

  // Get all classrooms for calculating stats
  const allClassrooms = await Classroom.find({
    teacher: userId,
    isDeleted: false,
  }).lean();

  // Calculate total students
  const totalStudents = allClassrooms.reduce(
    (sum, c) => sum + (c.students?.filter((s) => s.status === 'ACTIVE')?.length || 0),
    0
  );

  // Stats
  const [totalClassrooms, activeClassrooms, totalTeams, mentoringProjectsCount] = await Promise.all([
    Classroom.countDocuments({
      teacher: userId,
      isDeleted: false,
    }),
    Classroom.countDocuments({
      teacher: userId,
      isDeleted: false,
      isArchived: false,
    }),
    Team.countDocuments({
      classroom: { $in: allClassrooms.map((c) => c._id) },
      isDeleted: false,
    }),
    Project.countDocuments({
      'mentors.user': userId,
      isDeleted: false,
    }),
  ]);

  const stats = {
    totalClassrooms,
    activeClassrooms,
    totalStudents,
    totalTeams,
    pendingEvaluations: pendingEvaluations.length,
    mentoringProjects: mentoringProjectsCount,
  };

  return ApiResponse.success(res, {
    classrooms,
    pendingEvaluations,
    mentoringProjects,
    stats,
  });
});

/**
 * @desc    Get general stats
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;

  if (userRole === 'TEACHER') {
    return getTeacherDashboard(req, res);
  }

  return getStudentDashboard(req, res);
});

module.exports = {
  getStudentDashboard,
  getTeacherDashboard,
  getStats,
};
