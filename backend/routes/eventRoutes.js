/**
 * Event Routes
 *
 * Defines API endpoints for community events:
 *
 *   POST   /api/events       – Create (admin only)
 *   GET    /api/events       – Retrieve all (public)
 *   GET    /api/events/:id   – Retrieve single (public)
 *   PUT    /api/events/:id   – Update (admin only)
 *   DELETE /api/events/:id   – Delete (admin only)
 *
 * Admin routes require a valid JWT (authenticate) and Administrator role
 * (authorizeAdmin) before reaching the controller.
 * The create and update routes additionally run validateEvent to reject
 * malformed request bodies early.
 *
 * Requirements: 3.1, 3.3, 3.5, 3.8, 3.10
 */

const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/roleMiddleware');
const { validateEvent, validateEventUpdate } = require('../middleware/validationMiddleware');

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

// GET /api/events – Retrieve all events (earliest first)
// Requirement 3.3: Backend SHALL provide an endpoint to retrieve all Events
router.get('/', eventController.getAll);

// GET /api/events/:id – Retrieve a single event by ID
// Requirement 3.5: Backend SHALL provide an endpoint to retrieve a single Event by ID
router.get('/:id', eventController.getById);

// ---------------------------------------------------------------------------
// Admin-only routes (authentication + authorization required)
// ---------------------------------------------------------------------------

// POST /api/events – Create a new event
// Requirements 3.1, 3.2, 3.12
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateEvent,
  eventController.create
);

// PUT /api/events/:id – Update an existing event
// Requirements 3.8, 3.9, 3.12
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validateEventUpdate,
  eventController.update
);

// DELETE /api/events/:id – Delete an event
// Requirements 3.10, 3.11, 3.12
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  eventController.delete
);

module.exports = router;
