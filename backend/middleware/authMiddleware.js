const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens for protected endpoints.
 * Extracts token from Authorization header (Bearer <token> format),
 * verifies it, and attaches decoded user info to req.user.
 * 
 * Requirements: 1.7, 1.8, 1.9
 */
function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        message: 'Authentication required',
        statusCode: 401
      });
    }
    
    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Expected format: Bearer <token>',
        statusCode: 401
      });
    }
    
    const token = parts[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
        message: 'Authentication required',
        statusCode: 401
      });
    }
    
    // Verify token using JWT_SECRET from environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach decoded user info to request object
    // Payload contains: { userId, email, role }
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    // Continue to next middleware or route handler
    next();
  } catch (error) {
    // Handle JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed',
        statusCode: 401
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Please log in again',
        statusCode: 401
      });
    }
    
    // Handle other errors
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      message: 'Authentication failed',
      statusCode: 401
    });
  }
}

module.exports = authenticate;
