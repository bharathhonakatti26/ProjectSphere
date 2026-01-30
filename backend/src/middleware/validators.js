const { body, param, query, validationResult } = require('express-validator');
const { badRequest } = require('../utils/ApiError');

/**
 * Validation error handler middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    throw badRequest('Validation failed', extractedErrors);
  }

  next();
};

/**
 * Auth Validators
 */
const authValidators = {
  register: [
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['STUDENT', 'TEACHER'])
      .withMessage('Role must be either STUDENT or TEACHER'),
    validate,
  ],

  login: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    validate,
  ],
};

/**
 * User Validators
 */
const userValidators = {
  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name cannot exceed 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name cannot exceed 50 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Department cannot exceed 100 characters'),
    body('institution')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Institution cannot exceed 200 characters'),
    validate,
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
    validate,
  ],
};

/**
 * Classroom Validators
 */
const classroomValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Classroom name is required')
      .isLength({ max: 100 })
      .withMessage('Classroom name cannot exceed 100 characters'),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ max: 100 })
      .withMessage('Subject cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    validate,
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Classroom name cannot exceed 100 characters'),
    body('subject')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subject cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    validate,
  ],

  joinByCode: [
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Classroom code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Classroom code must be 6 characters'),
    validate,
  ],
};

/**
 * Team Validators
 */
const teamValidators = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Team name is required')
      .isLength({ max: 100 })
      .withMessage('Team name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('classroomId')
      .optional()
      .isMongoId()
      .withMessage('Invalid classroom ID'),
    body('classroom')
      .optional()
      .isMongoId()
      .withMessage('Invalid classroom ID'),
    body()
      .custom((value, { req }) => {
        if (!req.body.classroomId && !req.body.classroom) {
          throw new Error('Classroom ID is required (classroomId or classroom)');
        }
        return true;
      }),
    validate,
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Team name cannot exceed 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    validate,
  ],

  evaluate: [
    body('marks')
      .notEmpty()
      .withMessage('Marks are required')
      .isFloat({ min: 0, max: 100 })
      .withMessage('Marks must be between 0 and 100'),
    body('remarks')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Remarks cannot exceed 1000 characters'),
    validate,
  ],
};

/**
 * Project Validators
 */
const projectValidators = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Project title is required')
      .isLength({ max: 200 })
      .withMessage('Project title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('type')
      .notEmpty()
      .withMessage('Project type is required')
      .isIn(['STUDENT_INITIATED', 'TEACHER_INITIATED', 'CLASSROOM_BASED'])
      .withMessage('Invalid project type'),
    body('visibility')
      .optional()
      .isIn(['PRIVATE', 'TEAM_ONLY', 'CLASS_ONLY', 'PUBLIC'])
      .withMessage('Invalid visibility'),
    validate,
  ],

  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Project title cannot exceed 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('visibility')
      .optional()
      .isIn(['PRIVATE', 'TEAM_ONLY', 'CLASS_ONLY', 'PUBLIC'])
      .withMessage('Invalid visibility'),
    body('status')
      .optional()
      .isIn(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'])
      .withMessage('Invalid status'),
    validate,
  ],
};

/**
 * Chat Validators
 */
const chatValidators = {
  sendMessage: [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: 5000 })
      .withMessage('Message cannot exceed 5000 characters'),
    validate,
  ],

  createDirectMessage: [
    body('recipientId')
      .notEmpty()
      .withMessage('Recipient ID is required')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    validate,
  ],
};

/**
 * Common Validators
 */
const commonValidators = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
    validate,
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate,
  ],
};

module.exports = {
  validate,
  authValidators,
  userValidators,
  classroomValidators,
  teamValidators,
  projectValidators,
  chatValidators,
  commonValidators,
};
