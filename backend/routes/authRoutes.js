/**
 * Authentication Routes
 *
 * Defines the public authentication endpoints:
 *  - POST /api/auth/register  – Create a new user account
 *  - POST /api/auth/login     – Authenticate and receive a JWT token
 *
 * Each route applies the appropriate validation middleware before delegating
 * to the auth controller.
 *
 * Requirements: 1.1, 1.4
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const {
  validateRegistration,
  validateLogin,
} = require('../middleware/validationMiddleware');

// POST /api/auth/register
// Validates registration fields then creates a new user (Resident role by default).
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login
// Validates login fields then authenticates the user and returns a JWT token.
router.post('/login', validateLogin, authController.login);

module.exports = router;
