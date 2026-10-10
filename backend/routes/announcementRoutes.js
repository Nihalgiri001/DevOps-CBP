/**
 * Announcement Routes
 *
 * Defines API endpoints for community announcements:
 *
 *   POST   /api/announcements       – Create (admin only)
 *   GET    /api/announcements       – Retrieve all (public)
 *   GET    /api/announcements/:id   – Retrieve single (public)
 *   PUT    /api/announcements/:id   – Update (admin only)
 *   DELETE /api/announcements/:id   – Delete (admin only)
 *
 * Admin routes require a valid JWT (authenticate) and Administrator role
 * (authorizeAdmin) before reaching the controller.
 * The create and update routes additionally run validateAnnouncement to
 * reject malformed request bodies early.
 *
 * Requirements: 2.1, 2.3, 2.5, 2.8, 2.10
 */

const express = require('express');
const router = express.Router();

const announcementController = require('../controllers/announcementController');
const authenticate = require('../middleware/authMiddleware');
const authorizeAdmin = require('../middleware/roleMiddleware');
const { validateAnnouncement, validateAnnouncementUpdate } = require('../middleware/validationMiddleware');

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

// GET /api/announcements – Retrieve all announcements (newest first)
// Requirement 2.3: Backend SHALL provide an endpoint to retrieve all Announcements
router.get('/', announcementController.getAll);

// GET /api/announcements/:id – Retrieve a single announcement by ID
// Requirement 2.5: Backend SHALL provide an endpoint to retrieve a single Announcement by ID
router.get('/:id', announcementController.getById);

// ---------------------------------------------------------------------------
// Admin-only routes (authentication + authorization required)
// ---------------------------------------------------------------------------

// POST /api/announcements – Create a new announcement
// Requirements 2.1, 2.2, 2.12
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  validateAnnouncement,
  announcementController.create
);

// PUT /api/announcements/:id – Update an existing announcement
// Requirements 2.8, 2.9, 2.12
router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  validateAnnouncementUpdate,
  announcementController.update
);

// DELETE /api/announcements/:id – Delete an announcement
// Requirements 2.10, 2.11, 2.12
router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  announcementController.delete
);

module.exports = router;
