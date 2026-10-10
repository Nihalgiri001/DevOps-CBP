const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authMiddleware');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key';

describe('Authentication Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });
  
  describe('Valid token scenarios', () => {
    it('should attach decoded user info to req.user with valid token', () => {
      // Create a valid token
      const payload = {
        userId: '123456',
        email: 'test@example.com',
        role: 'Resident'
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      // Set Authorization header
      req.headers.authorization = `Bearer ${token}`;
      
      // Execute middleware
      authenticate(req, res, next);
      
      // Verify user info attached to request
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe('123456');
      expect(req.user.email).toBe('test@example.com');
      expect(req.user.role).toBe('Resident');
      
      // Verify next() was called
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
    
    it('should work with Administrator role', () => {
      const payload = {
        userId: '789',
        email: 'admin@example.com',
        role: 'Administrator'
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      
      req.headers.authorization = `Bearer ${token}`;
      
      authenticate(req, res, next);
      
      expect(req.user.role).toBe('Administrator');
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('Missing token scenarios', () => {
    it('should return 401 when no authorization header is provided', () => {
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No authorization header provided',
        message: 'Authentication required',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 when authorization header is empty string', () => {
      req.headers.authorization = '';
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 401
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Invalid token format scenarios', () => {
    it('should return 401 when Bearer prefix is missing', () => {
      const token = jwt.sign({ userId: '123' }, process.env.JWT_SECRET);
      req.headers.authorization = token; // Missing "Bearer " prefix
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Expected format: Bearer <token>',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 when using wrong auth scheme (Basic)', () => {
      req.headers.authorization = 'Basic abc123';
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Expected format: Bearer <token>',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 when Bearer has no token after it', () => {
      req.headers.authorization = 'Bearer ';
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
        message: 'Authentication required',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Invalid token scenarios', () => {
    it('should return 401 for malformed token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 for token signed with wrong secret', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'Resident' },
        'wrong-secret',
        { expiresIn: '24h' }
      );
      req.headers.authorization = `Bearer ${token}`;
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 for expired token', () => {
      // Create a token that expired 1 hour ago
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'Resident' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${token}`;
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        message: 'Please log in again',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Edge cases', () => {
    it('should handle authorization header with extra spaces', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'Resident' },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `Bearer  ${token}`; // Extra space
      
      authenticate(req, res, next);
      
      // Should still fail because split(' ') will create more than 2 parts
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle case-sensitive Bearer keyword', () => {
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com', role: 'Resident' },
        process.env.JWT_SECRET
      );
      req.headers.authorization = `bearer ${token}`; // lowercase
      
      authenticate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid authorization header format',
        message: 'Expected format: Bearer <token>',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
