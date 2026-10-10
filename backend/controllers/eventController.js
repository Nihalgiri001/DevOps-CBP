/**
 * Event Controller
 *
 * Handles CRUD operations for community events.
 *
 * - create   (admin only): POST /api/events         → 201
 * - getAll   (public):     GET  /api/events         → 200
 * - getById  (public):     GET  /api/events/:id     → 200 | 404
 * - update   (admin only): PUT  /api/events/:id     → 200 | 404
 * - delete   (admin only): DELETE /api/events/:id   → 200 | 404
 *
 * Invalid ObjectId values result in a 400 response.
 * Events are sorted by date ascending (earliest first).
 *
 * Requirements: 3.1, 3.2, 3.4, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12
 */

const mongoose = require('mongoose');
const Event = require('../models/Event');
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
    next(new AppError(`Invalid event ID format: ${id}`, 400));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Controller functions
// ---------------------------------------------------------------------------

/**
 * POST /api/events
 * Create a new event (Administrator only).
 *
 * Validation of the request body is performed by validateEvent middleware
 * upstream, so the controller can trust that title, description, date,
 * time, and location are present and within allowed limits.
 *
 * Requirements: 3.1, 3.2, 3.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function create(req, res, next) {
  try {
    const { title, description, date, time, location } = req.body;

    const event = new Event({ title, description, date, time, location });
    await event.save();

    return res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events
 * Retrieve all events sorted by date ascending (earliest first).
 *
 * Requirements: 3.3, 3.4
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getAll(req, res, next) {
  try {
    const events = await Event.find().sort({ date: 1 });

    return res.status(200).json({
      success: true,
      data: events,
      message: 'Events retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/events/:id
 * Retrieve a single event by its MongoDB ObjectId.
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if no event with that ID exists.
 *
 * Requirements: 3.5, 3.6, 3.7
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const event = await Event.findById(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: event,
      message: 'Event retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/events/:id
 * Update an existing event by ID (Administrator only).
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if the event does not exist.
 * All body fields are optional – only provided fields are applied.
 *
 * Requirements: 3.8, 3.9, 3.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const { title, description, date, time, location } = req.body;

    // Build update object with only the fields that were provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;

    const event = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/events/:id
 * Delete an event by ID (Administrator only).
 *
 * Returns 400 for invalid ObjectId format.
 * Returns 404 if the event does not exist.
 *
 * Requirements: 3.10, 3.11, 3.12
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function deleteEvent(req, res, next) {
  try {
    const { id } = req.params;

    if (!assertValidObjectId(id, next)) return;

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Event deleted successfully',
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
  delete: deleteEvent,
};
