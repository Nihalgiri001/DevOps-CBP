/**
 * Role-Based Authorization Middleware
 * 
 * Validates user roles for administrative endpoints.
 * Must be used AFTER authenticate middleware, which populates req.user.
 * Checks if req.user.role is 'Administrator' and returns 403 for non-admin users.
 * 
 * Requirements: 15.3, 15.4, 15.5
 */

/**
 * Middleware to authorize Administrator access
 * 
 * @param {Object} req - Express request object (must have req.user populated by authenticate middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * Usage: router.post('/api/announcements', authenticate, authorizeAdmin, controller.create)
 */
function authorizeAdmin(req, res, next) {
  try {
    // Verify that authenticate middleware has run and populated req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        message: 'Authentication required before authorization',
        statusCode: 401
      });
    }
    
    // Check if user has Administrator role
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Administrator access required',
        message: 'You do not have permission to perform this action',
        statusCode: 403
      });
    }
    
    // User is an Administrator, proceed to route handler
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authorization error',
      message: 'An error occurred during authorization',
      statusCode: 500
    });
  }
}

module.exports = authorizeAdmin;
