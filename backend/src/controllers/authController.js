const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const {
  generateTokenPair,
  verifyRefreshToken,
  ApiResponse,
  unauthorized,
  badRequest,
  conflict,
} = require('../utils');
const config = require('../config');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, department, institution, studentId, employeeId } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflict('User with this email already exists');
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role,
    department,
    institution,
    studentId: role === 'STUDENT' ? studentId : undefined,
    employeeId: role === 'TEACHER' ? employeeId : undefined,
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);

  // Save refresh token
  await user.addRefreshToken(refreshToken);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return ApiResponse.created(res, {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    accessToken,
  }, 'Registration successful');
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email, isDeleted: false }).select('+password');

  if (!user) {
    throw unauthorized('Invalid credentials');
  }

  if (!user.isActive) {
    throw unauthorized('Account is deactivated');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw unauthorized('Invalid credentials');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokenPair(user._id, user.role);

  // Save refresh token
  await user.addRefreshToken(refreshToken);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      avatar: user.avatar,
    },
    accessToken,
  }, 'Login successful');
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw unauthorized('Refresh token is required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw unauthorized('Invalid or expired refresh token');
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  if (!user || user.isDeleted || !user.isActive) {
    throw unauthorized('User not found or inactive');
  }

  const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken);
  if (!tokenExists) {
    throw unauthorized('Refresh token not found');
  }

  // Generate new tokens
  const tokens = generateTokenPair(user._id, user.role);

  // Remove old refresh token and add new one
  await user.removeRefreshToken(refreshToken);
  await user.addRefreshToken(tokens.refreshToken);

  // Set new refresh token in cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return ApiResponse.success(res, {
    accessToken: tokens.accessToken,
  }, 'Token refreshed successfully');
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (refreshToken && req.user) {
    await req.user.removeRefreshToken(refreshToken);
  }

  // Clear cookie
  res.clearCookie('refreshToken');

  return ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
  await req.user.clearAllRefreshTokens();

  // Clear cookie
  res.clearCookie('refreshToken');

  return ApiResponse.success(res, null, 'Logged out from all devices');
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, {
    user: req.user,
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  getMe,
};
