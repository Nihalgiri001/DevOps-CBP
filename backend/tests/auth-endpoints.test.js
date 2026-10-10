/**
 * Authentication Endpoint Tests
 *
 * Integration tests for POST /api/auth/register and POST /api/auth/login.
 * Tests cover success cases, duplicate email, invalid input, invalid credentials,
 * and missing fields.
 *
 * Requirements: 10.2, 10.7, 10.9, 10.10
 */

const request = require('supertest');
const app = require('../server');
const {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
} = require('./setup');

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearCollections);

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

describe('POST /api/auth/register', () => {
  const validUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123',
  };

  // Requirement 10.2 – test successful creation
  it('should register a new user and return 201 with user data', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.userId).toBeDefined();
    expect(res.body.data.username).toBe(validUser.username);
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data.role).toBe('Resident'); // default role
    // Password must never appear in the response
    expect(res.body.data.password).toBeUndefined();
  });

  // Requirement 10.9 – duplicate email → 409
  it('should return 409 when registering with an already-used email', async () => {
    // First registration
    await request(app).post('/api/auth/register').send(validUser);

    // Second registration with same email
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'otheruser', email: validUser.email, password: 'pass456' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.7 – invalid payload → 400
  it('should return 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'a@b.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', email: 'a@b.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when username is shorter than 3 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'a@b.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  const registeredUser = {
    username: 'loginuser',
    email: 'loginuser@example.com',
    password: 'securepassword',
  };

  // Seed a user before each login test
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(registeredUser);
  });

  // Requirement 10.2 – successful login
  it('should return 200 with a JWT token and user data on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: registeredUser.email, password: registeredUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(registeredUser.email);
    expect(res.body.data.user.role).toBe('Resident');
    // Password must never appear in the response
    expect(res.body.data.user.password).toBeUndefined();
  });

  // Requirement 10.10 – invalid credentials → 401
  it('should return 401 when password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: registeredUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.7 – missing credentials → 400
  it('should return 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: registeredUser.email });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when both email and password are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
