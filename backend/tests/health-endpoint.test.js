/**
 * Health Check Endpoint Tests
 *
 * Integration tests for GET /health.
 * Verifies the response structure and expected fields.
 *
 * Requirements: 10.1, 10.2
 */

const request = require('supertest');
const app = require('../server');
const { connectTestDb, disconnectTestDb } = require('./setup');

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

describe('GET /health', () => {
  // Requirement 10.1, 10.2 – health endpoint returns 200 with expected fields
  it('should return 200 status code', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('should return JSON content type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should return all expected fields: status, timestamp, uptime, database, environment', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');

    // timestamp must be a valid ISO 8601 string
    expect(typeof res.body.timestamp).toBe('string');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);

    // uptime must be a non-negative number (seconds)
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);

    // database status must reflect connected test DB
    expect(res.body.database).toBe('connected');

    // environment field must be present (set to 'test' by setup.js)
    expect(res.body.environment).toBeDefined();
    expect(typeof res.body.environment).toBe('string');
  });

  it('should return "test" as the environment when NODE_ENV=test', async () => {
    const res = await request(app).get('/health');
    expect(res.body.environment).toBe('test');
  });

  it('should be accessible without authentication', async () => {
    // No Authorization header – health endpoint is public
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
