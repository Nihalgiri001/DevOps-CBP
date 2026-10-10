/**
 * Unit tests for validationMiddleware.js
 *
 * Tests each exported validator array against a minimal Express app
 * to confirm that valid payloads pass through and invalid payloads
 * receive a 400 response with the expected error format.
 *
 * Requirements: 4.1, 4.2
 */

const express = require('express');
const request = require('supertest');

const {
  validateRegistration,
  validateLogin,
  validateAnnouncement,
  validateEvent,
} = require('../middleware/validationMiddleware');

// ---------------------------------------------------------------------------
// Helper: build a minimal app that applies the given validators then 200 OK
// ---------------------------------------------------------------------------
function buildApp(validators) {
  const app = express();
  app.use(express.json());
  app.post('/test', validators, (req, res) => res.status(200).json({ success: true }));
  return app;
}

// ---------------------------------------------------------------------------
// validateRegistration
// ---------------------------------------------------------------------------
describe('validateRegistration', () => {
  const app = buildApp(validateRegistration);

  const valid = { username: 'john_doe', email: 'john@example.com', password: 'secret1' };

  it('passes with valid data', async () => {
    const res = await request(app).post('/test').send(valid);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 when username is missing', async () => {
    const { username, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.some((e) => e.field === 'username')).toBe(true);
  });

  it('returns 400 when email is missing', async () => {
    const { email, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'email')).toBe(true);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await request(app).post('/test').send({ ...valid, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'email')).toBe(true);
  });

  it('returns 400 when password is missing', async () => {
    const { password, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'password')).toBe(true);
  });

  it('returns 400 when password is too short (< 6 chars)', async () => {
    const res = await request(app).post('/test').send({ ...valid, password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'password')).toBe(true);
  });

  it('returns 400 when username is too short (< 3 chars)', async () => {
    const res = await request(app).post('/test').send({ ...valid, username: 'ab' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'username')).toBe(true);
  });

  it('returns 400 when username exceeds 50 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, username: 'a'.repeat(51) });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'username')).toBe(true);
  });

  it('includes statusCode 400 in the error body', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.body.statusCode).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// validateLogin
// ---------------------------------------------------------------------------
describe('validateLogin', () => {
  const app = buildApp(validateLogin);

  const valid = { email: 'user@example.com', password: 'anypass' };

  it('passes with valid data', async () => {
    const res = await request(app).post('/test').send(valid);
    expect(res.status).toBe(200);
  });

  it('returns 400 when email is missing', async () => {
    const { email, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'email')).toBe(true);
  });

  it('returns 400 when email format is invalid', async () => {
    const res = await request(app).post('/test').send({ ...valid, email: 'bad-email' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'email')).toBe(true);
  });

  it('returns 400 when password is missing', async () => {
    const { password, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'password')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateAnnouncement
// ---------------------------------------------------------------------------
describe('validateAnnouncement', () => {
  const app = buildApp(validateAnnouncement);

  const valid = {
    title: 'Pool Maintenance',
    content: 'The pool will be closed for maintenance on Saturday.',
    author: 'Admin Team',
  };

  it('passes with valid data', async () => {
    const res = await request(app).post('/test').send(valid);
    expect(res.status).toBe(200);
  });

  it('returns 400 when title is missing', async () => {
    const { title, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'title')).toBe(true);
  });

  it('returns 400 when title exceeds 200 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, title: 'T'.repeat(201) });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'title')).toBe(true);
  });

  it('returns 400 when content is missing', async () => {
    const { content, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'content')).toBe(true);
  });

  it('returns 400 when content exceeds 5000 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, content: 'C'.repeat(5001) });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'content')).toBe(true);
  });

  it('returns 400 when author is missing', async () => {
    const { author, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'author')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateEvent
// ---------------------------------------------------------------------------
describe('validateEvent', () => {
  const app = buildApp(validateEvent);

  const valid = {
    title: 'Annual Community BBQ',
    description: 'Join us for our annual summer BBQ.',
    date: '2025-07-15',
    time: '18:00',
    location: 'Community Garden',
  };

  it('passes with valid data', async () => {
    const res = await request(app).post('/test').send(valid);
    expect(res.status).toBe(200);
  });

  it('returns 400 when title is missing', async () => {
    const { title, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'title')).toBe(true);
  });

  it('returns 400 when title exceeds 200 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, title: 'T'.repeat(201) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when description is missing', async () => {
    const { description, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'description')).toBe(true);
  });

  it('returns 400 when description exceeds 5000 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, description: 'D'.repeat(5001) });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date is missing', async () => {
    const { date, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'date')).toBe(true);
  });

  it('returns 400 when date format is wrong (not YYYY-MM-DD)', async () => {
    const res = await request(app).post('/test').send({ ...valid, date: '15-07-2025' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'date')).toBe(true);
  });

  it('returns 400 when date is an invalid calendar date', async () => {
    const res = await request(app).post('/test').send({ ...valid, date: '2025-02-30' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'date')).toBe(true);
  });

  it('returns 400 when time is missing', async () => {
    const { time, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'time')).toBe(true);
  });

  it('returns 400 when time format is wrong', async () => {
    const res = await request(app).post('/test').send({ ...valid, time: '6pm' });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'time')).toBe(true);
  });

  it('returns 400 when time has invalid hours (> 23)', async () => {
    const res = await request(app).post('/test').send({ ...valid, time: '25:00' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when time has invalid minutes (> 59)', async () => {
    const res = await request(app).post('/test').send({ ...valid, time: '12:60' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when location is missing', async () => {
    const { location, ...body } = valid;
    const res = await request(app).post('/test').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'location')).toBe(true);
  });

  it('returns 400 when location exceeds 300 chars', async () => {
    const res = await request(app).post('/test').send({ ...valid, location: 'L'.repeat(301) });
    expect(res.status).toBe(400);
    expect(res.body.message.some((e) => e.field === 'location')).toBe(true);
  });
});
