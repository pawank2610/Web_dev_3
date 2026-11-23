const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema(
  {
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: [true, 'Link ID is required for recording clicks'],
      index: true,
    },
    ipAddress: {
      type: String,
      default: 'Anonymous',
    },
    userAgent: {
      type: String,
      default: '',
    },
    deviceType: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Other'],
      default: 'Desktop',
      index: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    referrer: {
      type: String,
      default: 'Direct',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// Compound index for fast aggregation by link and timestamp
clickSchema.index({ linkId: 1, timestamp: -1 });
// Compound index for fast aggregation by link and device type
clickSchema.index({ linkId: 1, deviceType: 1 });

module.exports = mongoose.model('Click', clickSchema);
