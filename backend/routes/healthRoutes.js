/**
 * Health Routes
 *
 * Defines the health check endpoint:
 *
 *   GET /health – Returns system health status (public)
 *
 * This is a public endpoint – no authentication is required.
 * It is intended for use by Kubernetes liveness/readiness probes
 * and monitoring systems.
 *
 * Requirements: 6.1, 6.2
 */

const express = require('express');
const router = express.Router();

const { getHealth } = require('../controllers/healthController');

// ---------------------------------------------------------------------------
// Public route
// ---------------------------------------------------------------------------

// GET /health – Return system health status
// Requirements 6.1, 6.2: Backend SHALL provide a Health_Endpoint at /health
// and SHALL return status 200 with system status information
router.get('/', getHealth);

module.exports = router;
