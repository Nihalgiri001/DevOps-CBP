/**
 * Announcements Endpoint Tests
 *
 * Integration tests for the full CRUD lifecycle of /api/announcements.
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

/** Create an announcement directly through the API (admin auth). */
async function createAnnouncement(data = {}) {
  const payload = {
    title: 'Test Announcement',
    content: 'This is the announcement content.',
    author: 'Admin Team',
    ...data,
  };
  const res = await request(app)
    .post('/api/announcements')
    .set('Authorization', `Bearer ${generateAdminToken()}`)
    .send(payload);
  return res;
}

// ---------------------------------------------------------------------------
// POST /api/announcements
// ---------------------------------------------------------------------------

describe('POST /api/announcements', () => {
  // Requirement 10.2 – successful creation by admin
  it('should create an announcement and return 201 when admin token is provided', async () => {
    const res = await createAnnouncement();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.title).toBe('Test Announcement');
    expect(res.body.data.content).toBe('This is the announcement content.');
    expect(res.body.data.author).toBe('Admin Team');
    expect(res.body.data.createdAt).toBeDefined();
  });

  // Requirement 10.9 – no token → 401
  it('should return 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .send({ title: 'T', content: 'C', author: 'A' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.9 – resident token → 403
  it('should return 403 when a Resident token is provided', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${generateResidentToken()}`)
      .send({ title: 'T', content: 'C', author: 'A' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.7 – invalid input → 400
  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ content: 'Content only', author: 'Admin' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when content is missing', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Title only', author: 'Admin' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when author is missing', async () => {
    const res = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Title', content: 'Content' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/announcements
// ---------------------------------------------------------------------------

describe('GET /api/announcements', () => {
  // Requirement 10.3 – retrieve list
  it('should return 200 with an empty array when no announcements exist', async () => {
    const res = await request(app).get('/api/announcements');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  it('should return 200 with all announcements sorted newest-first', async () => {
    await createAnnouncement({ title: 'First' });
    await new Promise((r) => setTimeout(r, 10)); // ensure distinct timestamps
    await createAnnouncement({ title: 'Second' });

    const res = await request(app).get('/api/announcements');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    // Newest first
    expect(res.body.data[0].title).toBe('Second');
    expect(res.body.data[1].title).toBe('First');
  });
});

// ---------------------------------------------------------------------------
// GET /api/announcements/:id
// ---------------------------------------------------------------------------

describe('GET /api/announcements/:id', () => {
  // Requirement 10.4 – retrieve single resource
  it('should return 200 with the announcement when a valid ID is provided', async () => {
    const created = await createAnnouncement({ title: 'Specific Announcement' });
    const id = created.body.data._id;

    const res = await request(app).get(`/api/announcements/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(id);
    expect(res.body.data.title).toBe('Specific Announcement');
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when the ID does not match any announcement', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/announcements/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when the ID format is invalid', async () => {
    const res = await request(app).get('/api/announcements/not-a-valid-id');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/announcements/:id
// ---------------------------------------------------------------------------

describe('PUT /api/announcements/:id', () => {
  let announcementId;

  beforeEach(async () => {
    const res = await createAnnouncement({ title: 'Original Title' });
    announcementId = res.body.data._id;
  });

  // Requirement 10.5 – update existing resource
  it('should update an announcement and return 200 when admin token is provided', async () => {
    const res = await request(app)
      .put(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('should return 401 when no token is provided for update', async () => {
    const res = await request(app)
      .put(`/api/announcements/${announcementId}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a Resident token is provided for update', async () => {
    const res = await request(app)
      .put(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${generateResidentToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when updating a non-existent announcement', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .put(`/api/announcements/${nonExistentId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/announcements/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/announcements/:id', () => {
  let announcementId;

  beforeEach(async () => {
    const res = await createAnnouncement();
    announcementId = res.body.data._id;
  });

  // Requirement 10.6 – delete resource
  it('should delete an announcement and return 200 when admin token is provided', async () => {
    const res = await request(app)
      .delete(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();

    // Confirm the resource is gone
    const getRes = await request(app).get(`/api/announcements/${announcementId}`);
    expect(getRes.status).toBe(404);
  });

  it('should return 401 when no token is provided for delete', async () => {
    const res = await request(app).delete(`/api/announcements/${announcementId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 403 when a Resident token is provided for delete', async () => {
    const res = await request(app)
      .delete(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${generateResidentToken()}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Requirement 10.8 – missing resource → 404
  it('should return 404 when deleting a non-existent announcement', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .delete(`/api/announcements/${nonExistentId}`)
      .set('Authorization', `Bearer ${generateAdminToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
