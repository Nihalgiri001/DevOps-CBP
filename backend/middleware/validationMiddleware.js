/**
 * Input Validation Middleware
 *
 * Provides express-validator rule sets for each resource type and a shared
 * handler that collects validation errors and returns a 400 response when
 * any rule fails.
 *
 * Exported validators:
 *  - validateRegistration  – POST /api/auth/register
 *  - validateLogin         – POST /api/auth/login
 *  - validateAnnouncement  – POST/PUT /api/announcements
 *  - validateEvent         – POST/PUT /api/events
 *
 * Requirements: 4.1, 4.2
 *
 * Error response format (400):
 * {
 *   "success": false,
 *   "error": "Validation failed",
 *   "message": [
 *     { "field": "email", "message": "Must be a valid email address" },
 *     ...
 *   ],
 *   "statusCode": 400
 * }
 */

const { body, validationResult } = require('express-validator');

// ---------------------------------------------------------------------------
// Shared validation result handler
// ---------------------------------------------------------------------------

/**
 * Collects the results of all preceding express-validator checks.
 * If any errors exist, responds with 400 and the error array.
 * Otherwise calls next() to proceed to the route handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a consistent { field, message } shape
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param || 'unknown',
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: formatted,
      statusCode: 400,
    });
  }

  return next();
}

// ---------------------------------------------------------------------------
// Registration validation
// Requirements: 1.1, 4.1, 4.2
//   username – required, 3–50 characters
//   email    – required, valid email format
//   password – required, minimum 6 characters
// ---------------------------------------------------------------------------

const validateRegistration = [
  body('username')
    .exists({ checkFalsy: true })
    .withMessage('Username is required')
    .isString()
    .withMessage('Username must be a string')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .isLength({ max: 50 })
    .withMessage('Username must not exceed 50 characters'),

  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Login validation
// Requirements: 1.4, 4.1, 4.2
//   email    – required, valid email format
//   password – required
// ---------------------------------------------------------------------------

const validateLogin = [
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .exists({ checkFalsy: true })
    .withMessage('Password is required'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Announcement validation
// Requirements: 2.1, 4.1, 4.2
//   title   – required, max 200 characters
//   content – required, max 5000 characters
//   author  – required
// ---------------------------------------------------------------------------

const validateAnnouncement = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),

  body('content')
    .exists({ checkFalsy: true })
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .isLength({ max: 5000 })
    .withMessage('Content must not exceed 5000 characters'),

  body('author')
    .exists({ checkFalsy: true })
    .withMessage('Author is required')
    .isString()
    .withMessage('Author must be a string')
    .trim(),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Event validation
// Requirements: 3.1, 4.1, 4.2
//   title       – required, max 200 characters
//   description – required, max 5000 characters
//   date        – required, ISO 8601 YYYY-MM-DD format
//   time        – required, HH:MM (24-hour) format
//   location    – required, max 300 characters
// ---------------------------------------------------------------------------

const validateEvent = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),

  body('description')
    .exists({ checkFalsy: true })
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('date')
    .exists({ checkFalsy: true })
    .withMessage('Date is required')
    .isString()
    .withMessage('Date must be a string')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format (ISO 8601)')
    .custom((value) => {
      // Ensure it is a real calendar date (e.g. not 2025-13-40)
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Date must be a valid calendar date');
      }
      // Confirm the parsed date matches the original string to catch edge
      // cases like 2025-02-30 which JS silently rolls over.
      const [year, month, day] = value.split('-').map(Number);
      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
      ) {
        throw new Error('Date must be a valid calendar date');
      }
      return true;
    }),

  body('time')
    .exists({ checkFalsy: true })
    .withMessage('Time is required')
    .isString()
    .withMessage('Time must be a string')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format (24-hour clock)'),

  body('location')
    .exists({ checkFalsy: true })
    .withMessage('Location is required')
    .isString()
    .withMessage('Location must be a string')
    .trim()
    .isLength({ max: 300 })
    .withMessage('Location must not exceed 300 characters'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Event update validation (all fields optional – partial updates)
// Requirements: 3.8, 4.1, 4.2
//   title       – optional, max 200 characters
//   description – optional, max 5000 characters
//   date        – optional, ISO 8601 YYYY-MM-DD format
//   time        – optional, HH:MM (24-hour) format
//   location    – optional, max 300 characters
// ---------------------------------------------------------------------------

const validateEventUpdate = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),

  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('date')
    .optional()
    .isString()
    .withMessage('Date must be a string')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format (ISO 8601)')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Date must be a valid calendar date');
      }
      const [year, month, day] = value.split('-').map(Number);
      if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
      ) {
        throw new Error('Date must be a valid calendar date');
      }
      return true;
    }),

  body('time')
    .optional()
    .isString()
    .withMessage('Time must be a string')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Time must be in HH:MM format (24-hour clock)'),

  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim()
    .isLength({ max: 300 })
    .withMessage('Location must not exceed 300 characters'),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Announcement update validation (all fields optional – partial updates)
// Requirements: 2.8, 4.1, 4.2
//   title   – optional, max 200 characters
//   content – optional, max 5000 characters
//   author  – optional
// ---------------------------------------------------------------------------

const validateAnnouncementUpdate = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),

  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .isLength({ max: 5000 })
    .withMessage('Content must not exceed 5000 characters'),

  body('author')
    .optional()
    .isString()
    .withMessage('Author must be a string')
    .trim(),

  handleValidationErrors,
];

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  validateRegistration,
  validateLogin,
  validateAnnouncement,
  validateAnnouncementUpdate,
  validateEvent,
  validateEventUpdate,
  handleValidationErrors, // exported for testing
};
