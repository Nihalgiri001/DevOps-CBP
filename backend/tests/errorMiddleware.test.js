/**
 * Tests for centralized error handling middleware
 *
 * Covers:
 *  - AppError class
 *  - errorHandler middleware:
 *      Mongoose ValidationError  → 400
 *      Duplicate key (code 11000) → 409
 *      CastError                  → 400
 *      JWT errors                 → 401
 *      Generic Error              → 500
 *      AppError (pass-through)    → uses error.statusCode
 *
 * Requirements: 4.3, 4.4, 4.5, 5.6, 6.4
 */

const { AppError, errorHandler } = require('../middleware/errorMiddleware');

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/** Build a minimal mock Express request */
function mockReq(overrides = {}) {
  return { method: 'GET', path: '/test', body: {}, ...overrides };
}

/** Build a mock Express response with chainable status/json */
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const noop = jest.fn(); // next() stub – should never be called by errorHandler

// Silence console.error during tests to keep output clean
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
});

// -------------------------------------------------------------------------
// AppError class
// -------------------------------------------------------------------------

describe('AppError', () => {
  it('extends Error and sets message and statusCode', () => {
    const err = new AppError('Not Found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toBe('Not Found');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('AppError');
  });

  it('captures a stack trace', () => {
    const err = new AppError('Oops', 400);
    expect(err.stack).toBeDefined();
  });
});

// -------------------------------------------------------------------------
// errorHandler – response format (Requirement 4.5)
// -------------------------------------------------------------------------

describe('errorHandler response format', () => {
  it('returns { success, error, message, statusCode } on every error', () => {
    const err = new AppError('Resource not found', 404);
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body).toMatchObject({
      success: false,
      error: expect.any(String),
      message: expect.any(String),
      statusCode: 404,
    });
  });
});

// -------------------------------------------------------------------------
// AppError pass-through
// -------------------------------------------------------------------------

describe('errorHandler – AppError', () => {
  it('uses statusCode from AppError', () => {
    const err = new AppError('Forbidden', 403);
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, statusCode: 403 })
    );
  });

  it('exposes 4xx message directly to client', () => {
    const err = new AppError('Bad input data', 400);
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Bad input data');
    expect(body.error).toBe('Bad input data');
  });
});

// -------------------------------------------------------------------------
// Mongoose ValidationError → 400 (Requirement 4.1 / 4.2)
// -------------------------------------------------------------------------

describe('errorHandler – Mongoose ValidationError', () => {
  it('converts ValidationError to 400 with field messages', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        username: { message: 'Username must be at least 3 characters' },
      },
    };
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    // Combined field messages should appear somewhere in error/message
    expect(body.message).toContain('Validation failed');
  });

  it('includes all field errors in the message', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        title: { message: 'Title is required' },
      },
    };
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('Title is required');
  });
});

// -------------------------------------------------------------------------
// Duplicate key error (code 11000) → 409
// -------------------------------------------------------------------------

describe('errorHandler – duplicate key error (11000)', () => {
  it('returns 409 for duplicate email', () => {
    const err = {
      code: 11000,
      keyValue: { email: 'test@example.com' },
    };
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(409);
    expect(body.message).toContain('email');
  });

  it('falls back to keyPattern when keyValue is absent', () => {
    const err = {
      code: 11000,
      keyPattern: { username: 1 },
    };
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toContain('username');
  });
});

// -------------------------------------------------------------------------
// CastError → 400
// -------------------------------------------------------------------------

describe('errorHandler – Mongoose CastError', () => {
  it('returns 400 for invalid ObjectId', () => {
    const err = {
      name: 'CastError',
      path: '_id',
      value: 'not-a-valid-id',
    };
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(400);
    expect(body.message).toContain('_id');
  });
});

// -------------------------------------------------------------------------
// JWT errors → 401
// -------------------------------------------------------------------------

describe('errorHandler – JWT errors', () => {
  it('returns 401 for JsonWebTokenError', () => {
    const err = new Error('jwt malformed');
    err.name = 'JsonWebTokenError';
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(401);
  });

  it('returns 401 for TokenExpiredError', () => {
    const err = new Error('jwt expired');
    err.name = 'TokenExpiredError';
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(401);
    expect(body.message).toContain('expired');
  });
});

// -------------------------------------------------------------------------
// Generic / unhandled errors → 500 (Requirement 4.3)
// -------------------------------------------------------------------------

describe('errorHandler – generic server errors', () => {
  it('returns 500 for a plain Error', () => {
    const err = new Error('Unexpected database failure');
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(500);
  });

  it('hides internal error detail from the 500 response body', () => {
    const err = new Error('SELECT * FROM users WHERE ...');
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    const body = res.json.mock.calls[0][0];
    // Client should receive a generic message, not the raw SQL / detail
    expect(body.message).not.toContain('SELECT');
    expect(body.error).toBe('Internal Server Error');
  });

  it('returns 500 when err.statusCode is undefined', () => {
    const err = { message: 'Something exploded' }; // plain object, no statusCode
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// -------------------------------------------------------------------------
// Sensitive data NOT logged (Requirement 5.6)
// -------------------------------------------------------------------------

describe('errorHandler – sensitive data exclusion (Requirement 5.6)', () => {
  it('does not include password in logged output', () => {
    const err = new AppError('Test', 400);
    const req = mockReq({ body: { password: 'supersecret', email: 'a@b.com' } });
    const res = mockRes();

    errorHandler(err, req, res, noop);

    // console.error is mocked; check it was NOT called with the password value
    const calls = console.error.mock.calls.flat().join(' ');
    expect(calls).not.toContain('supersecret');
  });
});

// -------------------------------------------------------------------------
// Logging occurs on error (Requirement 6.4)
// -------------------------------------------------------------------------

describe('errorHandler – logging (Requirement 6.4)', () => {
  it('logs an error entry when an error is handled', () => {
    console.error.mockClear();
    const err = new AppError('Something broke', 500);
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    expect(console.error).toHaveBeenCalled();
    const logOutput = console.error.mock.calls[0][0];
    // Should contain ISO timestamp pattern and ERROR keyword
    expect(logOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
    expect(logOutput).toContain('ERROR');
  });

  it('log entry includes the error message', () => {
    console.error.mockClear();
    const err = new AppError('Specific error message', 422);
    const res = mockRes();

    errorHandler(err, mockReq(), res, noop);

    const logOutput = console.error.mock.calls[0][0];
    expect(logOutput).toContain('Specific error message');
  });
});
