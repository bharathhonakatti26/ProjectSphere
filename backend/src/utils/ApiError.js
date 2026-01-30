/**
 * Custom API Error Class
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create Bad Request Error (400)
 */
const badRequest = (message = 'Bad Request', errors = []) => {
  return new ApiError(400, message, errors);
};

/**
 * Create Unauthorized Error (401)
 */
const unauthorized = (message = 'Unauthorized') => {
  return new ApiError(401, message);
};

/**
 * Create Forbidden Error (403)
 */
const forbidden = (message = 'Forbidden') => {
  return new ApiError(403, message);
};

/**
 * Create Not Found Error (404)
 */
const notFound = (message = 'Not Found') => {
  return new ApiError(404, message);
};

/**
 * Create Conflict Error (409)
 */
const conflict = (message = 'Conflict') => {
  return new ApiError(409, message);
};

/**
 * Create Unprocessable Entity Error (422)
 */
const unprocessableEntity = (message = 'Unprocessable Entity', errors = []) => {
  return new ApiError(422, message, errors);
};

/**
 * Create Too Many Requests Error (429)
 */
const tooManyRequests = (message = 'Too Many Requests') => {
  return new ApiError(429, message);
};

/**
 * Create Internal Server Error (500)
 */
const internal = (message = 'Internal Server Error') => {
  return new ApiError(500, message, [], false);
};

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internal,
};
