/**
 * Centralized Error Handling Middleware
 *
 * Provides:
 *  - AppError: Custom error class carrying statusCode and message.
 *  - errorHandler: Express 4-argument error middleware that normalises
 *    Mongoose and JWT errors, logs them (without sensitive data), and
 *    returns a consistent JSON error response.
 *
 * Requirements: 4.3, 4.4, 4.5, 5.6, 6.4
 */

// ---------------------------------------------------------------------------
// AppError – custom error class
// ---------------------------------------------------------------------------

/**
 * Application-specific error with an HTTP status code.
 *
 * Usage:
 *   throw new AppError('Resource not found', 404);
 *   next(new AppError('Forbidden', 403));
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error description
   * @param {number} statusCode - HTTP status code (e.g. 400, 404, 409)
   */
  constructor(message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    // Capture stack trace (V8 only; no-op on other engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip sensitive fields from an object before logging.
 * Replaces password / token / secret values with "[REDACTED]".
 *
 * Requirement 5.6 / 6.7: The backend SHALL NOT log passwords,
 * Authentication_Tokens, or secrets.
 *
 * @param {Object} obj - Object to sanitise (e.g. req.body)
 * @returns {Object} Sanitised shallow copy
 */
function sanitiseForLog(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const SENSITIVE_KEYS = /password|token|secret|authorization/i;
  const copy = {};
  for (const [key, value] of Object.entries(obj)) {
    copy[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : value;
  }
  return copy;
}

/**
 * Log an error with ISO timestamp.  Excludes sensitive request data.
 *
 * Requirement 6.4: WHEN a server error occurs THE Backend_API SHALL
 * create a Log_Entry with timestamp and error details.
 *
 * @param {Error} err - The error to log
 * @param {Object} req - Express request (method / path only – no body secrets)
 */
function logError(err, req) {
  const timestamp = new Date().toISOString();
  const method = req ? req.method : 'UNKNOWN';
  const path = req ? req.path : 'UNKNOWN';
  // eslint-disable-next-line no-console
  console.error(`[${timestamp}] ERROR ${err.name || 'Error'}: ${err.message} | ${method} ${path}`);
}

// ---------------------------------------------------------------------------
// Error transformation helpers
// ---------------------------------------------------------------------------

/**
 * Transform a Mongoose ValidationError into an AppError (400).
 *
 * @param {import('mongoose').Error.ValidationError} err
 * @returns {AppError}
 */
function handleMongooseValidationError(err) {
  const messages = Object.values(err.errors)
    .map((e) => e.message)
    .join('; ');
  return new AppError(`Validation failed: ${messages}`, 400);
}

/**
 * Transform a MongoDB duplicate-key error (code 11000) into an AppError (409).
 *
 * @param {Object} err - MongoDB driver error with code 11000
 * @returns {AppError}
 */
function handleDuplicateKeyError(err) {
  // Extract the duplicated field name from the keyValue map or keyPattern map.
  const field = err.keyValue
    ? Object.keys(err.keyValue)[0]
    : Object.keys(err.keyPattern || {})[0] || 'field';
  return new AppError(`Duplicate value: ${field} already exists`, 409);
}

/**
 * Transform a Mongoose CastError (invalid ObjectId etc.) into an AppError (400).
 *
 * @param {import('mongoose').Error.CastError} err
 * @returns {AppError}
 */
function handleCastError(err) {
  return new AppError(`Invalid value for field '${err.path}': ${err.value}`, 400);
}

/**
 * Transform JWT errors into AppError (401).
 *
 * @param {Error} err - JsonWebTokenError or TokenExpiredError
 * @returns {AppError}
 */
function handleJwtError(err) {
  if (err.name === 'TokenExpiredError') {
    return new AppError('Authentication token has expired. Please log in again.', 401);
  }
  // JsonWebTokenError and any other JWT-related error
  return new AppError('Invalid authentication token.', 401);
}

// ---------------------------------------------------------------------------
// Main error handler middleware
// ---------------------------------------------------------------------------

/**
 * Express centralised error handler.
 *
 * Must be registered AFTER all routes and other middleware in server.js:
 *   app.use(errorHandler);
 *
 * Requirements:
 *  - 4.3  Return 500 and log for unhandled server errors
 *  - 4.4  Centralised error handling middleware
 *  - 4.5  Consistent JSON response format
 *  - 5.6  Do NOT log passwords / tokens / secrets
 *  - 6.4  Log with timestamp and error details
 *
 * @param {Error} err  - The error object passed via next(err)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next (required for Express to recognise 4-arg signature)
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // --- Normalise known error types into AppError ----------------------------

  let error = err;

  // Mongoose: field validation failure
  if (err.name === 'ValidationError' && err.errors) {
    error = handleMongooseValidationError(err);
  }
  // MongoDB driver: duplicate unique-index key (e.g. duplicate email)
  else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }
  // Mongoose: invalid ObjectId / type cast failure
  else if (err.name === 'CastError') {
    error = handleCastError(err);
  }
  // JWT: invalid or expired token
  else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJwtError(err);
  }

  // --- Determine final status code -----------------------------------------

  const statusCode = error.statusCode || 500;

  // --- Log the error (without sensitive data) ------------------------------
  // Only log 5xx errors as full errors; 4xx are logged at a lower severity
  // but we log all here to satisfy requirement 6.4.
  logError(error, req);

  // For 5xx: also emit original stack in non-production environments
  if (statusCode >= 500 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err.stack);
  }

  // --- Build consistent response --------------------------------------------
  // Requirement 4.5: { success, error, message, statusCode }
  // For 500 errors expose a generic message to the client (do not leak internals).

  const responseMessage =
    statusCode >= 500
      ? 'Something went wrong. Please try again later.'
      : error.message;

  const responseError =
    statusCode >= 500 ? 'Internal Server Error' : error.message;

  return res.status(statusCode).json({
    success: false,
    error: responseError,
    message: responseMessage,
    statusCode,
  });
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { AppError, errorHandler };
