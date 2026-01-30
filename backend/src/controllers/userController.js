const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const {
  ApiResponse,
  notFound,
  badRequest,
  parsePagination,
  parseSort,
  sanitizeSearchQuery,
} = require('../utils');

/**
 * @desc    Get user profile
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, isDeleted: false });

  if (!user) {
    throw notFound('User not found');
  }

  return ApiResponse.success(res, { user });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['firstName', 'lastName', 'bio', 'department', 'institution', 'avatar'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return ApiResponse.success(res, { user }, 'Profile updated successfully');
});

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw badRequest('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Clear all refresh tokens for security
  await user.clearAllRefreshTokens();

  return ApiResponse.success(res, null, 'Password changed successfully. Please login again.');
});

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  const { page, limit, skip } = parsePagination(req.query);

  const query = { isDeleted: false, isActive: true };

  if (q) {
    const searchRegex = new RegExp(sanitizeSearchQuery(q), 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  if (role && ['STUDENT', 'TEACHER'].includes(role)) {
    query.role = role;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('firstName lastName email role avatar department institution')
      .skip(skip)
      .limit(limit)
      .sort({ firstName: 1 }),
    User.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, users, { page, limit, total });
});

/**
 * @desc    Get teachers list
 * @route   GET /api/users/teachers
 * @access  Private
 */
const getTeachers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const query = { role: 'TEACHER', isDeleted: false, isActive: true };

  const [teachers, total] = await Promise.all([
    User.find(query)
      .select('firstName lastName email avatar department institution')
      .skip(skip)
      .limit(limit)
      .sort({ firstName: 1 }),
    User.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, teachers, { page, limit, total });
});

/**
 * @desc    Get students list
 * @route   GET /api/users/students
 * @access  Private (Teacher only)
 */
const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const query = { role: 'STUDENT', isDeleted: false, isActive: true };

  const [students, total] = await Promise.all([
    User.find(query)
      .select('firstName lastName email avatar department institution studentId')
      .skip(skip)
      .limit(limit)
      .sort({ firstName: 1 }),
    User.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, students, { page, limit, total });
});

/**
 * @desc    Deactivate account
 * @route   DELETE /api/users/account
 * @access  Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  await req.user.softDelete();

  return ApiResponse.success(res, null, 'Account deactivated successfully');
});

module.exports = {
  getUserProfile,
  updateProfile,
  changePassword,
  searchUsers,
  getTeachers,
  getStudents,
  deactivateAccount,
};
