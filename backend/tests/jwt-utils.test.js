/**
 * JWT Utilities Unit Tests
 *
 * Tests for generateToken in utils/jwtUtils.js.
 *
 * Requirements: 10.1
 */

const jwt = require('jsonwebtoken');
const { generateToken } = require('../utils/jwtUtils');

// Ensure JWT_SECRET is set before tests run
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-communitylink';

describe('JWT Utilities', () => {
  // Fake user object that mimics a Mongoose User document
  const mockUser = {
    _id: '64b1f2c3d4e5f6a7b8c9d0e1',
    email: 'test@example.com',
    role: 'Resident',
  };

  describe('generateToken', () => {
    it('should return a non-empty string', () => {
      const token = generateToken(mockUser);

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return a valid JWT with three dot-separated parts', () => {
      const token = generateToken(mockUser);
      const parts = token.split('.');

      expect(parts).toHaveLength(3);
    });

    it('should contain the userId in the payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // userId is set from user._id, which jwt serialises to a string
      expect(decoded.userId).toBeDefined();
      expect(decoded.userId.toString()).toBe(mockUser._id.toString());
    });

    it('should contain the email in the payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.email).toBe(mockUser.email);
    });

    it('should contain the role in the payload', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.role).toBe(mockUser.role);
    });

    it('should set the exp claim approximately 24 hours from now', () => {
      const beforeSign = Math.floor(Date.now() / 1000);
      const token = generateToken(mockUser);
      const afterSign = Math.floor(Date.now() / 1000);

      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();

      const expectedMin = beforeSign + 24 * 60 * 60;
      const expectedMax = afterSign + 24 * 60 * 60;

      expect(decoded.exp).toBeGreaterThanOrEqual(expectedMin);
      expect(decoded.exp).toBeLessThanOrEqual(expectedMax);
    });

    it('should generate different tokens for different users', () => {
      const anotherUser = {
        _id: '00000000000000000000abcd',
        email: 'other@example.com',
        role: 'Administrator',
      };

      const token1 = generateToken(mockUser);
      const token2 = generateToken(anotherUser);

      expect(token1).not.toBe(token2);
    });

    it('should produce a token that can be verified with the correct secret', () => {
      const token = generateToken(mockUser);

      expect(() => jwt.verify(token, process.env.JWT_SECRET)).not.toThrow();
    });

    it('should produce a token that fails verification with a wrong secret', () => {
      const token = generateToken(mockUser);

      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });
  });
});
