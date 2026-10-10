/**
 * Authentication Controller
 *
 * Handles user registration and login.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

const User = require('../models/User');
const { AppError } = require('../middleware/errorMiddleware');
const { generateToken } = require('../utils/jwtUtils');

/**
 * POST /api/auth/register
 *
 * Registers a new user account.
 *
 * - Validates input (done by validation middleware upstream)
 * - Saves new User (pre-save hook hashes the password)
 * - Returns 201 with user data (no password)
 *
 * Error cases:
 *  - 409: Duplicate email (MongoDB code 11000, handled by errorMiddleware)
 *  - 400: Missing/invalid fields (handled by validationMiddleware + Mongoose)
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Create and save user – password hashing is done by the pre-save hook
    const user = new User({ username, email, password });
    await user.save();

    return res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      message: 'User registered successfully',
    });
  } catch (error) {
    // Duplicate email: MongoDB unique-index error (code 11000)
    // The centralized errorMiddleware converts this to a 409 AppError,
    // but we surface a clearer message here before passing it on.
    if (error.code === 11000) {
      return next(new AppError('Email address is already registered', 409));
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user and returns a JWT token.
 *
 * - Looks up user by email (case-insensitive due to model's lowercase setting)
 * - Compares provided password against stored bcrypt hash
 * - Returns 200 with JWT token and user data
 *
 * Error cases:
 *  - 401: User not found or password mismatch
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Look up the user, explicitly selecting the password field
    // (it is excluded by default via toJSON transform)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Compare the provided password with the stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
