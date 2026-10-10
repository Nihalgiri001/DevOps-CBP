/**
 * JWT Utilities
 *
 * Provides token generation for the authentication flow.
 *
 * Requirements: 1.5, 15.6
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token for the given user.
 *
 * Token payload: { userId, email, role }
 * Expiry: 24 hours
 *
 * @param {Object} user - Mongoose User document (must have _id, email, role)
 * @returns {string} Signed JWT token
 */
function generateToken(user) {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
}

module.exports = { generateToken };
