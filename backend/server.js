/**
 * CommunityLink Backend – Server Entry Point
 *
 * Responsibilities:
 *  - Load environment variables from .env
 *  - Initialize Express application and middleware chain
 *  - Register all API routes
 *  - Connect to MongoDB (with retry logic)
 *  - Start the HTTP server on the configured port
 *  - Handle graceful shutdown on SIGTERM
 *
 * Middleware order (required):
 *  CORS → JSON body parser → request logger → routes → error handler
 *
 * Requirements: 5.1, 5.2, 6.3
 */

// ---------------------------------------------------------------------------
// Environment variables – must be loaded before any other module reads them
// ---------------------------------------------------------------------------
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Config / database
const { connectDatabase, setupConnectionHandlers, closeDatabase } = require('./config/database');

// Middleware
const { errorHandler } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/loggerMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const eventRoutes = require('./routes/eventRoutes');
const healthRoutes = require('./routes/healthRoutes');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ---------------------------------------------------------------------------
// Express application setup
// ---------------------------------------------------------------------------
const app = express();

// --- Middleware chain (order is significant) --------------------------------

// 1. CORS – allow cross-origin requests from the frontend
//    In production, restrict this to your actual frontend domain.
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// 2. JSON body parser – parse incoming JSON payloads
app.use(express.json());

// 3. Request logger – log method, path, status, duration to stdout
//    Requirement 6.5, 6.6: log all incoming requests
app.use(requestLogger);

// --- Routes -----------------------------------------------------------------

// Health check (no /api prefix – used by Kubernetes probes and monitoring)
// Requirement 6.1, 6.2
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/events', eventRoutes);

// --- Centralised error handler (must be registered LAST) -------------------
// Requirement 4.4: centralised error handling middleware
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

/**
 * Bootstrap the application:
 *  1. Set up MongoDB connection event handlers
 *  2. Connect to MongoDB (with retry / exponential backoff)
 *  3. Start the HTTP server
 */
async function startServer() {
  // Set up runtime connection event listeners before attempting to connect
  setupConnectionHandlers();

  // Connect to MongoDB – exits the process if all retries fail (per database.js)
  await connectDatabase();

  // Start listening for HTTP traffic
  const server = app.listen(PORT, () => {
    // Requirement 6.3: log application startup events
    console.log(`✓ CommunityLink backend started`);
    console.log(`  Environment : ${NODE_ENV}`);
    console.log(`  Port        : ${PORT}`);
    console.log(`  MongoDB URI : ${process.env.MONGODB_URI}`);
  });

  // -------------------------------------------------------------------------
  // Graceful shutdown on SIGTERM
  // (e.g. Kubernetes sends SIGTERM before killing the pod)
  // -------------------------------------------------------------------------
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Starting graceful shutdown...');

    // Stop accepting new connections, wait for in-flight requests to finish
    server.close(async () => {
      console.log('HTTP server closed.');

      try {
        await closeDatabase();
        console.log('Database connection closed. Exiting.');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database connection during shutdown:', err.message);
        process.exit(1);
      }
    });
  });

  return server;
}

// Run the server (only when this file is executed directly, not when required
// by tests so that tests can import `app` without starting a listener).
if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
}

// Export `app` for use in integration/unit tests
module.exports = app;
