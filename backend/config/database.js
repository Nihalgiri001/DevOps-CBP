const mongoose = require('mongoose');

/**
 * MongoDB Database Connection Configuration
 * 
 * Provides connection management with retry logic, event handlers,
 * and graceful shutdown capabilities.
 * 
 * Connection string format: mongodb://<host>:<port>/<database_name>
 * - Local Development: localhost:27017
 * - Docker Compose: mongodb:27017 (container hostname)
 * - Kubernetes: mongodb-service:27017 (service DNS name)
 */

/**
 * Connect to MongoDB with retry logic and exponential backoff
 * 
 * Attempts to connect up to 3 times with increasing delays between retries.
 * Exits the process gracefully if all connection attempts fail.
 * 
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  const maxRetries = 3;
  let retries = maxRetries;
  
  // MongoDB connection options
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,              // Automatically create indexes in development
    maxPoolSize: 10,              // Connection pool size
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  };

  while (retries > 0) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, options);
      console.log('✓ MongoDB connected successfully');
      return;
    } catch (error) {
      retries--;
      console.error(`MongoDB connection attempt failed. Retries left: ${retries}`);
      console.error(`Error: ${error.message}`);
      
      if (retries === 0) {
        console.error('✗ MongoDB connection failed after all retry attempts. Exiting...');
        process.exit(1);
      }
      
      // Exponential backoff: wait 5s, 10s, 15s between retries
      const delay = 5000 * (maxRetries - retries);
      console.log(`Waiting ${delay / 1000} seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Set up MongoDB connection event handlers
 * 
 * Monitors connection state and logs important events:
 * - connected: Initial successful connection
 * - disconnected: Connection lost (triggers reconnection attempt)
 * - error: Runtime connection errors
 */
function setupConnectionHandlers() {
  // Handle successful connection
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
  });

  // Handle disconnection
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
  });

  // Handle connection errors during runtime
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  // Handle reconnection
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
  });
}

/**
 * Gracefully close database connection
 * 
 * Used during application shutdown to properly close the MongoDB connection
 * and cleanup resources.
 * 
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed successfully');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 * 
 * Ensures the database connection is properly closed when the application
 * receives termination signals (SIGTERM, SIGINT).
 */
function setupGracefulShutdown() {
  // Handle SIGTERM (e.g., from Kubernetes, Docker)
  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Closing MongoDB connection...');
    await closeDatabase();
    process.exit(0);
  });

  // Handle SIGINT (e.g., Ctrl+C in terminal)
  process.on('SIGINT', async () => {
    console.log('SIGINT signal received. Closing MongoDB connection...');
    await closeDatabase();
    process.exit(0);
  });
}

module.exports = {
  connectDatabase,
  setupConnectionHandlers,
  closeDatabase,
  setupGracefulShutdown
};
