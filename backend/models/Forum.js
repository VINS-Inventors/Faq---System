const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  queryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Query', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Forum', forumSchema);