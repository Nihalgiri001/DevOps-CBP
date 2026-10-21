/**
 * Shared Test Setup
 *
 * Provides helpers for connecting/disconnecting a test MongoDB database and
 * for generating JWT tokens used in integration tests.
 *
 * Usage (in each test suite that hits the database):
 *
 *   const { connectTestDb, disconnectTestDb, clearCollections, generateAdminToken, generateResidentToken } = require('./setup');
 *
 *   beforeAll(connectTestDb);
 *   afterAll(disconnectTestDb);
 *   afterEach(clearCollections);
 *
 * Requirements: 10.11
 */

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Always use a dedicated test database so we never touch development data.
const TEST_DB_URI =
  process.env.MONGODB_TEST_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27018/communitylink_test';

// JWT secret used for signing test tokens – must match what the app uses.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-communitylink';
process.env.NODE_ENV = 'test';

/**
 * Connect to the test database.
 * Called in beforeAll() of each test suite that needs the database.
 */
async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
}

/**
 * Drop the test database and close the connection.
 * Called in afterAll() to leave no state behind.
 */
async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

/**
 * Delete all documents from every collection.
 * Called in afterEach() so each test starts with a clean slate.
 */
async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

/**
 * Generate a signed JWT token for an Administrator user.
 *
 * @param {string} [userId='admin-user-id'] - Fake user ID to embed in the token.
 * @returns {string} Signed JWT token
 */
function generateAdminToken(userId = 'admin-user-id') {
  return jwt.sign(
    { userId, email: 'admin@test.com', role: 'Administrator' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate a signed JWT token for a Resident user.
 *
 * @param {string} [userId='resident-user-id'] - Fake user ID to embed in the token.
 * @returns {string} Signed JWT token
 */
function generateResidentToken(userId = 'resident-user-id') {
  return jwt.sign(
    { userId, email: 'resident@test.com', role: 'Resident' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  generateAdminToken,
  generateResidentToken,
};
