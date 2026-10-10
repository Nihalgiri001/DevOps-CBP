const authorizeAdmin = require('../middleware/roleMiddleware');

describe('Role-Based Authorization Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      user: null // Will be populated by tests to simulate authenticate middleware
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });
  
  describe('Administrator access scenarios', () => {
    it('should allow access when user has Administrator role', () => {
      // Simulate req.user populated by authenticate middleware
      req.user = {
        userId: '123456',
        email: 'admin@example.com',
        role: 'Administrator'
      };
      
      // Execute middleware
      authorizeAdmin(req, res, next);
      
      // Verify next() was called (authorization passed)
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
    
    it('should allow access for multiple Administrator users', () => {
      req.user = {
        userId: '789',
        email: 'superadmin@example.com',
        role: 'Administrator'
      };
      
      authorizeAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('Non-Administrator access scenarios', () => {
    it('should return 403 when user has Resident role', () => {
      req.user = {
        userId: '123456',
        email: 'resident@example.com',
        role: 'Resident'
      };
      
      authorizeAdmin(req, res, next);
      
      // Verify 403 Forbidden response
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden: Administrator access required',
        message: 'You do not have permission to perform this action',
        statusCode: 403
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 403 when user has undefined role', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: undefined
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 403
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 403 when user has null role', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: null
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 403 when user has empty string role', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: ''
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 403 when user has invalid role', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: 'SuperUser' // Not a valid role
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Missing authentication scenarios', () => {
    it('should return 401 when req.user is not populated', () => {
      // req.user is null (authenticate middleware didn't run)
      
      authorizeAdmin(req, res, next);
      
      // Verify 401 Unauthorized response
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not authenticated',
        message: 'Authentication required before authorization',
        statusCode: 401
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 401 when req.user is undefined', () => {
      req.user = undefined;
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          statusCode: 401,
          error: 'User not authenticated'
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });
  
  describe('Edge cases', () => {
    it('should be case-sensitive for Administrator role', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: 'administrator' // lowercase
      };
      
      authorizeAdmin(req, res, next);
      
      // Should return 403 because role must be exactly 'Administrator'
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should be case-sensitive for Administrator role (uppercase)', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: 'ADMINISTRATOR' // uppercase
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should reject role with extra whitespace', () => {
      req.user = {
        userId: '123456',
        email: 'user@example.com',
        role: ' Administrator ' // with spaces
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle req.user with missing email field', () => {
      req.user = {
        userId: '123456',
        role: 'Administrator'
        // email is missing
      };
      
      authorizeAdmin(req, res, next);
      
      // Should still work because we only check role
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should handle req.user with only role field', () => {
      req.user = {
        role: 'Administrator'
      };
      
      authorizeAdmin(req, res, next);
      
      // Should allow access based on role alone
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
  
  describe('Integration with authenticate middleware', () => {
    it('should work correctly after authenticate middleware sets req.user', () => {
      // Simulate the exact payload structure from authenticate middleware
      req.user = {
        userId: '64abc123def456',
        email: 'admin@communitylink.com',
        role: 'Administrator'
      };
      
      authorizeAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('should correctly reject Resident after authenticate middleware', () => {
      // Simulate the exact payload structure from authenticate middleware
      req.user = {
        userId: '64abc123def456',
        email: 'resident@communitylink.com',
        role: 'Resident'
      };
      
      authorizeAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
