const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Model Tests', () => {
  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/communitylink_test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.role).toBe('Resident'); // Default role
      expect(savedUser.password).not.toBe('password123'); // Password should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should fail when username is too short', async () => {
      const user = new User({
        username: 'ab',
        email: 'test@example.com',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail when email is invalid', async () => {
      const user = new User({
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail when email is duplicate', async () => {
      const user1 = new User({
        username: 'user1',
        email: 'test@example.com',
        password: 'password123'
      });
      await user1.save();

      const user2 = new User({
        username: 'user2',
        email: 'test@example.com',
        password: 'password456'
      });

      await expect(user2.save()).rejects.toThrow();
    });

    it('should default role to Resident', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('Resident');
    });

    it('should allow Administrator role', async () => {
      const user = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Administrator'
      });

      const savedUser = await user.save();
      expect(savedUser.role).toBe('Administrator');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'plaintext123'
      });

      await user.save();

      expect(user.password).not.toBe('plaintext123');
      expect(user.password.length).toBe(60); // bcrypt hash length
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();
      const firstHash = user.password;

      user.username = 'updateduser';
      await user.save();

      expect(user.password).toBe(firstHash);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for valid password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();

      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();

      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Password Field Exclusion', () => {
    it('should exclude password from JSON output', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await user.save();

      const userJSON = user.toJSON();
      expect(userJSON.password).toBeUndefined();
      expect(userJSON.username).toBe('testuser');
      expect(userJSON.email).toBe('test@example.com');
    });
  });
});
