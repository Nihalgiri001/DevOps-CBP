const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

describe('Announcement Model Tests', () => {
  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/communitylink_test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Announcement.deleteMany({});
  });

  describe('Announcement Schema Validation', () => {
    it('should create an announcement with valid data', async () => {
      const announcementData = {
        title: 'Community Pool Maintenance',
        content: 'The pool will be closed for maintenance from January 20-25. We apologize for any inconvenience.',
        author: 'Admin Team'
      };

      const announcement = new Announcement(announcementData);
      const savedAnnouncement = await announcement.save();

      expect(savedAnnouncement._id).toBeDefined();
      expect(savedAnnouncement.title).toBe('Community Pool Maintenance');
      expect(savedAnnouncement.content).toBe('The pool will be closed for maintenance from January 20-25. We apologize for any inconvenience.');
      expect(savedAnnouncement.author).toBe('Admin Team');
      expect(savedAnnouncement.createdAt).toBeDefined();
      expect(savedAnnouncement.createdAt).toBeInstanceOf(Date);
    });

    it('should fail when title is missing', async () => {
      const announcement = new Announcement({
        content: 'This is a test announcement',
        author: 'Admin'
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should fail when content is missing', async () => {
      const announcement = new Announcement({
        title: 'Test Title',
        author: 'Admin'
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should fail when author is missing', async () => {
      const announcement = new Announcement({
        title: 'Test Title',
        content: 'Test content'
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should fail when title exceeds 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const announcement = new Announcement({
        title: longTitle,
        content: 'Test content',
        author: 'Admin'
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should fail when content exceeds 5000 characters', async () => {
      const longContent = 'a'.repeat(5001);
      const announcement = new Announcement({
        title: 'Test Title',
        content: longContent,
        author: 'Admin'
      });

      await expect(announcement.save()).rejects.toThrow();
    });

    it('should trim title whitespace', async () => {
      const announcement = new Announcement({
        title: '  Test Title  ',
        content: 'Test content',
        author: 'Admin'
      });

      const savedAnnouncement = await announcement.save();
      expect(savedAnnouncement.title).toBe('Test Title');
    });

    it('should trim author whitespace', async () => {
      const announcement = new Announcement({
        title: 'Test Title',
        content: 'Test content',
        author: '  Admin Team  '
      });

      const savedAnnouncement = await announcement.save();
      expect(savedAnnouncement.author).toBe('Admin Team');
    });

    it('should accept title at maximum length (200 characters)', async () => {
      const maxTitle = 'a'.repeat(200);
      const announcement = new Announcement({
        title: maxTitle,
        content: 'Test content',
        author: 'Admin'
      });

      const savedAnnouncement = await announcement.save();
      expect(savedAnnouncement.title).toBe(maxTitle);
    });

    it('should accept content at maximum length (5000 characters)', async () => {
      const maxContent = 'a'.repeat(5000);
      const announcement = new Announcement({
        title: 'Test Title',
        content: maxContent,
        author: 'Admin'
      });

      const savedAnnouncement = await announcement.save();
      expect(savedAnnouncement.content).toBe(maxContent);
    });
  });

  describe('CreatedAt Timestamp', () => {
    it('should automatically set createdAt on save', async () => {
      const announcement = new Announcement({
        title: 'Test Title',
        content: 'Test content',
        author: 'Admin'
      });

      const savedAnnouncement = await announcement.save();
      expect(savedAnnouncement.createdAt).toBeDefined();
      expect(savedAnnouncement.createdAt).toBeInstanceOf(Date);
    });

    it('should set createdAt to current time', async () => {
      const beforeSave = new Date();
      
      const announcement = new Announcement({
        title: 'Test Title',
        content: 'Test content',
        author: 'Admin'
      });

      const savedAnnouncement = await announcement.save();
      const afterSave = new Date();

      expect(savedAnnouncement.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedAnnouncement.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('CreatedAt Index', () => {
    it('should sort announcements by createdAt descending', async () => {
      // Create announcements at different times
      const announcement1 = new Announcement({
        title: 'First Announcement',
        content: 'First content',
        author: 'Admin'
      });
      await announcement1.save();

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const announcement2 = new Announcement({
        title: 'Second Announcement',
        content: 'Second content',
        author: 'Admin'
      });
      await announcement2.save();

      await new Promise(resolve => setTimeout(resolve, 10));

      const announcement3 = new Announcement({
        title: 'Third Announcement',
        content: 'Third content',
        author: 'Admin'
      });
      await announcement3.save();

      // Retrieve sorted by createdAt descending (newest first)
      const announcements = await Announcement.find().sort({ createdAt: -1 });

      expect(announcements).toHaveLength(3);
      expect(announcements[0].title).toBe('Third Announcement');
      expect(announcements[1].title).toBe('Second Announcement');
      expect(announcements[2].title).toBe('First Announcement');
    });
  });
});
