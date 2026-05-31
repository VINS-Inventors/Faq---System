const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  body: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  votes: { type: Number, default: 0 },
  votedBy: [{ type: String }],
  accepted: { type: Boolean, default: false },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  votes: { type: Number, default: 0 },
  votedBy: [{ type: String }],
  views: { type: Number, default: 0 },
  answers: [answerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
