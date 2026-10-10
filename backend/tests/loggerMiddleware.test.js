/**
 * Tests for request logging middleware
 *
 * Covers:
 *  - Logs method, path, and timestamp on each incoming request (Requirement 6.5)
 *  - Logs response status code and duration on response finish (Requirement 6.5)
 *  - Uses console.log (stdout) for container log collection (Requirement 6.6)
 *
 * Requirements: 6.5, 6.6
 */

const requestLogger = require('../middleware/loggerMiddleware');

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

/** Build a minimal mock Express request */
function mockReq(method = 'GET', path = '/test') {
  return { method, path };
}

/** Build a minimal mock Express response that can emit events */
function mockRes() {
  const listeners = {};
  return {
    on(event, handler) {
      listeners[event] = handler;
    },
    emit(event) {
      if (listeners[event]) listeners[event]();
    },
    statusCode: 200,
    _listeners: listeners,
  };
}

// Silence console.log during tests but capture calls
let logSpy;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  logSpy.mockRestore();
});
beforeEach(() => {
  logSpy.mockClear();
});

// -------------------------------------------------------------------------
// requestLogger – incoming request log
// -------------------------------------------------------------------------

describe('requestLogger – incoming request', () => {
  it('calls next() to pass control downstream', () => {
    const next = jest.fn();
    const req = mockReq('GET', '/api/health');
    const res = mockRes();

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs to stdout (console.log) when the request arrives', () => {
    const next = jest.fn();
    requestLogger(mockReq('POST', '/api/auth/register'), mockRes(), next);

    expect(logSpy).toHaveBeenCalled();
  });

  it('includes HTTP method in the log entry', () => {
    const next = jest.fn();
    requestLogger(mockReq('DELETE', '/api/events/123'), mockRes(), next);

    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('DELETE');
  });

  it('includes request path in the log entry', () => {
    const next = jest.fn();
    requestLogger(mockReq('GET', '/api/announcements'), mockRes(), next);

    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('/api/announcements');
  });

  it('includes an ISO 8601 timestamp in the log entry', () => {
    const next = jest.fn();
    requestLogger(mockReq('GET', '/health'), mockRes(), next);

    const logged = logSpy.mock.calls[0][0];
    // ISO 8601 pattern: [YYYY-MM-DDTHH:MM:SS...]
    expect(logged).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// -------------------------------------------------------------------------
// requestLogger – response finish log (Requirement 6.5)
// -------------------------------------------------------------------------

describe('requestLogger – response finish log', () => {
  it('logs status code and duration when response finishes', () => {
    const next = jest.fn();
    const res = mockRes();
    res.statusCode = 201;

    requestLogger(mockReq('POST', '/api/announcements'), res, next);

    // Clear initial request log, then trigger response finish
    logSpy.mockClear();
    res.emit('finish');

    expect(logSpy).toHaveBeenCalled();
    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('201');
  });

  it('includes request duration in milliseconds in the finish log', () => {
    const next = jest.fn();
    const res = mockRes();

    requestLogger(mockReq('GET', '/api/events'), res, next);

    logSpy.mockClear();
    res.emit('finish');

    const logged = logSpy.mock.calls[0][0];
    // Duration should appear as a number followed by "ms"
    expect(logged).toMatch(/\d+ms/);
  });

  it('includes method and path in the finish log', () => {
    const next = jest.fn();
    const res = mockRes();
    res.statusCode = 404;

    requestLogger(mockReq('PUT', '/api/announcements/abc'), res, next);

    logSpy.mockClear();
    res.emit('finish');

    const logged = logSpy.mock.calls[0][0];
    expect(logged).toContain('PUT');
    expect(logged).toContain('/api/announcements/abc');
  });

  it('includes an ISO 8601 timestamp in the finish log', () => {
    const next = jest.fn();
    const res = mockRes();

    requestLogger(mockReq('GET', '/health'), res, next);

    logSpy.mockClear();
    res.emit('finish');

    const logged = logSpy.mock.calls[0][0];
    expect(logged).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// -------------------------------------------------------------------------
// stdout logging (Requirement 6.6)
// -------------------------------------------------------------------------

describe('requestLogger – stdout output', () => {
  it('writes to console.log (stdout), not console.error (stderr)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const next = jest.fn();
    const res = mockRes();

    requestLogger(mockReq('GET', '/test'), res, next);
    res.emit('finish');

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
