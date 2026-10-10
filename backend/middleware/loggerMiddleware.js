/**
 * Request Logger Middleware
 *
 * Logs all incoming HTTP requests with method, path, and timestamp.
 * Logs response status code and request duration on response finish.
 * Outputs to stdout so logs are captured by container log collection.
 *
 * Requirements: 6.5, 6.6
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  // Log the incoming request
  console.log(`[${timestamp}] ${req.method} ${req.path} - Received`);

  // Attach a 'finish' listener to log response details after the response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
}

module.exports = requestLogger;
