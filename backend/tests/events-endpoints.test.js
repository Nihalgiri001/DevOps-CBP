/**
 * Events Endpoint Tests
 *
 * Integration tests for the full CRUD lifecycle of /api/events.
 * Covers admin creation, public reads, update, delete, and role/auth enforcement.
 *
 * Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 10.8, 10.9
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const {
  connectTestDb,
  disconnectTestDb,
  clearCollections,
  generateAdminToken,
  generateResidentToken,
} = require('./setup');

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
afterEach(clearCollections);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an event directly through the API (admin auth). */
async function createEvent(data = {}) {
  const payload = {
    title: 'Community BBQ',
    description: 'Annual community barbecue event.',
    date: '2025-07-15',
    time: '18:00',
    location: 'Community Garden',
    ...data,
  };
  return request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${generateAdminToken()}`)
    .send(payload);
}

// ---------------------------------------------------------------------------
// POST /api/events
// ---------------------------------------------------------------------------

describe('POST /api/events', () => {
  // Requirement 10.2 – successful creation by admin
  it('should create an event and return 201 when admin token is provided', async () => {
    const res = await createEvent();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Community BBQ');
    expect(res.body.data.description).toBe('Annual community barbecue event.');
    expect(res.body.data.date).toBe('2025-07-15');
    expect(res.body.data.time).toBe('18:00');
    expect(res.body.data.location).toBe('Community Garden');
    expect(res.body.data.createdAt).toBeDefined();
  });

  // Requirement 10.9 – no token → 401
  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Event',
        description: 'Desc',
        date: '2025-07-15',
        time: '18:00',
        location: 'Park',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.9 – resident token → 403
  it('should return 403 when a Resident token is provided', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateResidentToken()}`)
      .send({
        title: 'Event',
        description: 'Desc',
        date: '2025-07-15',
        time: '18:00',
        location: 'Park',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.7 – invalid input → 400
  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ description: 'Desc', date: '2025-07-15', time: '18:00', location: 'Park' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when date is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Event', description: 'Desc', time: '18:00', location: 'Park' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when date format is invalid (not YYYY-MM-DD)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({
        title: 'Event',
        description: 'Desc',
        date: '15/07/2025', // wrong format
        time: '18:00',
        location: 'Park',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when time format is invalid (not HH:MM)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({
        title: 'Event',
        description: 'Desc',
        date: '2025-07-15',
        time: '6pm', // wrong format
        location: 'Park',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when location is missing', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Event', description: 'Desc', date: '2025-07-15', time: '18:00' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/events
// ---------------------------------------------------------------------------

describe('GET /api/events', () => {
  // Requirement 10.3 – retrieve list
  it('should return 200 with an empty array when no events exist', async () => {
    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 200 with all events sorted by date ascending (earliest first)', async () => {
    await createEvent({ title: 'Later Event', date: '2025-09-01' });
    await createEvent({ title: 'Earlier Event', date: '2025-07-01' });

    const res = await request(app).get('/api/events');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    // Earliest first
    expect(res.body.data[0].title).toBe('Earlier Event');
    expect(res.body.data[1].title).toBe('Later Event');
  });
});

// ---------------------------------------------------------------------------
// GET /api/events/:id
// ---------------------------------------------------------------------------

describe('GET /api/events/:id', () => {
  // Requirement 10.4 – retrieve single resource
  it('should return 200 with the event when a valid ID is provided', async () => {
    const created = await createEvent({ title: 'Specific Event' });
    const id = created.body.data._id;

    const res = await request(app).get(`/api/events/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(id);
    expect(res.body.data.title).toBe('Specific Event');
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when the ID does not match any event', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/events/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when the ID format is invalid', async () => {
    const res = await request(app).get('/api/events/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id
// ---------------------------------------------------------------------------

describe('PUT /api/events/:id', () => {
  let eventId;

  beforeEach(async () => {
    const res = await createEvent({ title: 'Original Event' });
    eventId = res.body.data._id;
  });

  // Requirement 10.5 – update existing resource
  it('should update an event and return 200 when admin token is provided', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Updated Event', time: '19:00' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Event');
    expect(res.body.data.time).toBe('19:00');
  });

  it('should return 401 when no token is provided for update', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a Resident token is provided for update', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${generateResidentToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when updating a non-existent event', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/events/${nonExistentId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/events/:id', () => {
  let eventId;

  beforeEach(async () => {
    const res = await createEvent();
    eventId = res.body.data._id;
  });

  // Requirement 10.6 – delete resource
  it('should delete an event and return 200 when admin token is provided', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();

    // Confirm the resource is gone
    const getRes = await request(app).get(`/api/events/${eventId}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 401 when no token is provided for delete', async () => {
    const res = await request(app).delete(`/api/events/${eventId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a Resident token is provided for delete', async () => {
    const res = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${generateResidentToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when deleting a non-existent event', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/events/${nonExistentId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
