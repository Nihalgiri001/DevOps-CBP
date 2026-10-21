const mongoose = require('mongoose');
const Event = require('../models/Event');

describe('Event Model Tests', () => {
  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/communitylink_test';
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Event.deleteMany({});
  });

  describe('Event Schema Validation', () => {
    it('should create an event with valid data', async () => {
      const eventData = {
        title: 'Annual Community BBQ',
        description: 'Join us for our annual summer BBQ with food, games, and entertainment for all ages.',
        date: '2025-07-15',
        time: '18:00',
        location: 'Community Garden'
      };

      const event = new Event(eventData);
      const savedEvent = await event.save();

      expect(savedEvent._id).toBeDefined();
      expect(savedEvent.title).toBe('Annual Community BBQ');
      expect(savedEvent.description).toBe('Join us for our annual summer BBQ with food, games, and entertainment for all ages.');
      expect(savedEvent.date).toBe('2025-07-15');
      expect(savedEvent.time).toBe('18:00');
      expect(savedEvent.location).toBe('Community Garden');
      expect(savedEvent.createdAt).toBeDefined();
      expect(savedEvent.createdAt).toBeInstanceOf(Date);
    });

    it('should fail when title is missing', async () => {
      const event = new Event({
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when description is missing', async () => {
      const event = new Event({
        title: 'Test Event',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when date is missing', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when time is missing', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when location is missing', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when title exceeds 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const event = new Event({
        title: longTitle,
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when description exceeds 5000 characters', async () => {
      const longDescription = 'a'.repeat(5001);
      const event = new Event({
        title: 'Test Event',
        description: longDescription,
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail when location exceeds 300 characters', async () => {
      const longLocation = 'a'.repeat(301);
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: longLocation
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should trim title whitespace', async () => {
      const event = new Event({
        title: '  Test Event  ',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.title).toBe('Test Event');
    });

    it('should trim location whitespace', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: '  Community Garden  '
      });

      const savedEvent = await event.save();
      expect(savedEvent.location).toBe('Community Garden');
    });

    it('should accept title at maximum length (200 characters)', async () => {
      const maxTitle = 'a'.repeat(200);
      const event = new Event({
        title: maxTitle,
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.title).toBe(maxTitle);
    });

    it('should accept description at maximum length (5000 characters)', async () => {
      const maxDescription = 'a'.repeat(5000);
      const event = new Event({
        title: 'Test Event',
        description: maxDescription,
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.description).toBe(maxDescription);
    });

    it('should accept location at maximum length (300 characters)', async () => {
      const maxLocation = 'a'.repeat(300);
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: maxLocation
      });

      const savedEvent = await event.save();
      expect(savedEvent.location).toBe(maxLocation);
    });
  });

  describe('Date Validation', () => {
    it('should accept valid ISO 8601 date format (YYYY-MM-DD)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-12-31',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.date).toBe('2025-12-31');
    });

    it('should fail with invalid date format (DD-MM-YYYY)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '15-07-2025',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with invalid date format (MM/DD/YYYY)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '07/15/2025',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with invalid date format (YYYY/MM/DD)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025/07/15',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with incomplete date', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07',
        time: '18:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });
  });

  describe('Time Validation', () => {
    it('should accept valid time in HH:MM format (00:00)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '00:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.time).toBe('00:00');
    });

    it('should accept valid time in HH:MM format (23:59)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '23:59',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.time).toBe('23:59');
    });

    it('should accept valid time in HH:MM format (12:30)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '12:30',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.time).toBe('12:30');
    });

    it('should fail with invalid time format (12:30 PM)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '12:30 PM',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with invalid time format (6:30)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '6:30',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with invalid hour (24:00)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '24:00',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with invalid minute (12:60)', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '12:60',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });

    it('should fail with incomplete time', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '12',
        location: 'Test Location'
      });

      await expect(event.save()).rejects.toThrow();
    });
  });

  describe('CreatedAt Timestamp', () => {
    it('should automatically set createdAt on save', async () => {
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      expect(savedEvent.createdAt).toBeDefined();
      expect(savedEvent.createdAt).toBeInstanceOf(Date);
    });

    it('should set createdAt to current time', async () => {
      const beforeSave = new Date();
      
      const event = new Event({
        title: 'Test Event',
        description: 'Test description',
        date: '2025-07-15',
        time: '18:00',
        location: 'Test Location'
      });

      const savedEvent = await event.save();
      const afterSave = new Date();

      expect(savedEvent.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedEvent.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Date Index', () => {
    it('should sort events by date ascending', async () => {
      // Create events with different dates
      const event1 = new Event({
        title: 'Third Event',
        description: 'Event on Aug 1',
        date: '2025-08-01',
        time: '18:00',
        location: 'Test Location'
      });
      await event1.save();

      const event2 = new Event({
        title: 'First Event',
        description: 'Event on July 1',
        date: '2025-07-01',
        time: '10:00',
        location: 'Test Location'
      });
      await event2.save();

      const event3 = new Event({
        title: 'Second Event',
        description: 'Event on July 15',
        date: '2025-07-15',
        time: '14:00',
        location: 'Test Location'
      });
      await event3.save();

      // Retrieve sorted by date ascending (earliest first)
      const events = await Event.find().sort({ date: 1 });

      expect(events).toHaveLength(3);
      expect(events[0].title).toBe('First Event');
      expect(events[0].date).toBe('2025-07-01');
      expect(events[1].title).toBe('Second Event');
      expect(events[1].date).toBe('2025-07-15');
      expect(events[2].title).toBe('Third Event');
      expect(events[2].date).toBe('2025-08-01');
    });
  });
});
