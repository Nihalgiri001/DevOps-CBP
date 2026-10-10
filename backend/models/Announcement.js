const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxLength: [200, 'Title must not exceed 200 characters'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxLength: [5000, 'Content must not exceed 5000 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create descending index on createdAt for sorting (newest first)
announcementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
