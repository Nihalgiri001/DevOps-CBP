const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxLength: [200, 'Title must not exceed 200 characters'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxLength: [5000, 'Description must not exceed 5000 characters']
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    validate: {
      validator: function(value) {
        // ISO 8601 date format validation (YYYY-MM-DD)
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      },
      message: 'Invalid date format (expected YYYY-MM-DD)'
    }
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    validate: {
      validator: function(value) {
        // HH:MM format validation (24-hour)
        return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
      },
      message: 'Invalid time format (expected HH:MM)'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    maxLength: [300, 'Location must not exceed 300 characters'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create ascending index on date for sorting (earliest first)
eventSchema.index({ date: 1 });

module.exports = mongoose.model('Event', eventSchema);
