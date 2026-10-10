/**
 * Announcement Controller
 *
 * Handles CRUD operations for community announcements.
 *
 * - create   (admin only): POST /api/announcements         → 201
 * - getAll   (public):     GET  /api/announcements         → 200
 * - getById  (public):     GET  /api/announcements/:id     → 200 | 404
 * - update   (admin only): PUT  /api/announcements/:id     → 200 | 404
 * - delete   (admin only): DELETE /api/announcements/:id   → 200 | 404
 *
 * Invalid ObjectId values result in a 400 response.
 *
 * Requirements: 2.1, 2.2, 2.4, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12
 */

const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const { AppError } = require('../middleware/errorMiddleware');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Validates a MongoDB ObjectId string and calls next() with a 400 AppError
 * if it is not a valid ObjectId.
 *
 * @param {string} id - The ID string to validate
 * @param {Function} next - Express next middleware function
 * @returns {boolean} true if valid, false if invalid (error already forwarded)
 */
function assertValidObjectId(id, next) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError(`Invalid announcement ID format: ${id}`, 400));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------------------

/**
 * POST /api/announcements
 * Create a new announcement (Administrator only).
 *
 * Validation of the request body is performed by validateAnnouncement
 * middleware upstream, so the controller can trust that title, content,
 * and author are present and within length limits.
 *
 * Requirements: 2.1, 2.2, 2.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function create(req, res, next) {
  try {
    const { title, content, author } = req.body;

    const announcement = new Announcement({ title, content, author });
    await announcement.save();

    return res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/announcements
 * Retrieve all announcements sorted by createdAt descending (newest first).
 *
 * Requirements: 2.3, 2.4
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getAll(req, res, next) {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: announcements,
      message: 'Announcements retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/announcements/:id
 * Retrieve a single announcement by its MongoDB ObjectId.
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if no announcement with that ID exists.
 *
 * Requirements: 2.5, 2.6, 2.7
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/announcements/:id
 * Update an existing announcement by ID (Administrator only).
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if the announcement does not exist.
 * All body fields (title, content, author) are optional – only provided
 * fields are applied.
 *
 * Requirements: 2.8, 2.9, 2.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const { title, content, author } = req.body;

    // Build update object with only the fields that were provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/announcements/:id
 * Delete an announcement by ID (Administrator only).
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if the announcement does not exist.
 *
 * Requirements: 2.10, 2.11, 2.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  create,
  getAll,
  getById,
  update,
  delete: deleteAnnouncement,
};
