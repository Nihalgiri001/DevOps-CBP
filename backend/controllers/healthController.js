/**
 * Health Controller
 *
 * Handles system health status reporting.
 *
 * - getHealth (public): GET /health → 200 (healthy) | 500 (unhealthy)
 *
 * Response includes:
 *   - status:      "healthy" | "unhealthy"
 *   - timestamp:   ISO 8601 current datetime
 *   - uptime:      process.uptime() in seconds
 *   - database:    "connected" | "disconnected"
 *   - environment: process.env.NODE_ENV
 *
 * Database state is determined via mongoose.connection.readyState:
 *   1 = connected, anything else = disconnected
 *
 * Requirements: 6.1, 6.2
 */

const mongoose = require('mongoose');

/**
 * GET /health
 * Returns the current operational status of the API and its dependencies.
 *
 * Returns 200 when the database is connected (healthy).
 * Returns 500 when the database is not connected (unhealthy).
 *
 * Requirements: 6.1, 6.2
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getHealth(req, res) {
  // mongoose.connection.readyState values:
  //   0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  const status = isDatabaseConnected ? 'healthy' : 'unhealthy';
  const databaseStatus = isDatabaseConnected ? 'connected' : 'disconnected';
  const statusCode = isDatabaseConnected ? 200 : 500;

  return res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: databaseStatus,
    environment: process.env.NODE_ENV || 'development',
  });
}

module.exports = { getHealth };
