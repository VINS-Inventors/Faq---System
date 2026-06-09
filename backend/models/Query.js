const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['General', 'Technical', 'Feature', 'Bug'],
    default: 'General'
  },
  status: {
    type: String,
    enum: ['PENDING', 'REVIEWING', 'APPROVED', 'ESCALATED', 'RESOLVED'],
    default: 'PENDING'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  answer: { type: String, default: null },
  attachments: [{ type: String }],
  linkedFAQs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FAQ' }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  escalationReason: { type: String, default: null },
  viewCount: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  helpfulVotes: [{ type: String }],
  notHelpfulVotes: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Query', querySchema);