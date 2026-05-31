const db = require('../config/db');
const { randomUUID } = require('crypto');

// ── List posts (with optional tag/search filter) ─────────────────────────────
exports.getPosts = async (req, res) => {
  try {
    const posts = await db.Post_find({}, { sort: { createdAt: -1 } });
    const { q, tag } = req.query;
    let result = posts;
    if (tag) result = result.filter(p => p.tags?.includes(tag));
    if (q) {
      const lq = q.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(lq) || p.body?.toLowerCase().includes(lq)
      );
    }
    res.json(result.map(p => ({
      ...p,
      answerCount: p.answers?.length || 0,
      hasAccepted: (p.answers || []).some(a => a.accepted),
      answers: undefined,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single post (increments view count) ──────────────────────────────────
exports.getPost = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await db.Post_findByIdAndUpdate(req.params.id, { views: (post.views || 0) + 1 });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Create post ───────────────────────────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    if (!title?.trim() || !body?.trim()) return res.status(400).json({ message: 'title and body required' });
    const post = await db.Post_create({
      title: title.trim(),
      body: body.trim(),
      tags: tags || [],
      authorId: req.user.id,
      authorName: req.user.name,
      votes: 0,
      votedBy: [],
      views: 0,
      answers: [],
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete post (owner or admin) ──────────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.authorId) !== String(req.user.id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await db.Post_findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Vote on post ──────────────────────────────────────────────────────────────
exports.votePost = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const uid = String(req.user.id);
    const votedBy = (post.votedBy || []).map(String);
    const { dir } = req.body; // 1 or -1
    let newVotedBy, newVotes;
    if (votedBy.includes(uid)) {
      newVotedBy = votedBy.filter(v => v !== uid);
      newVotes = (post.votes || 0) - (dir || 1);
    } else {
      newVotedBy = [...votedBy, uid];
      newVotes = (post.votes || 0) + (dir || 1);
    }
    const updated = await db.Post_findByIdAndUpdate(req.params.id, { votes: newVotes, votedBy: newVotedBy });
    res.json({ votes: newVotes, votedBy: newVotedBy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Add answer ────────────────────────────────────────────────────────────────
exports.addAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'body required' });
    const answer = {
      _id: randomUUID(),
      body: body.trim(),
      authorId: req.user.id,
      authorName: req.user.name,
      votes: 0,
      votedBy: [],
      accepted: false,
      createdAt: new Date().toISOString(),
    };
    const answers = [...(post.answers || []), answer];
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Vote on answer ────────────────────────────────────────────────────────────
exports.voteAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const uid = String(req.user.id);
    const { dir } = req.body;
    const answers = (post.answers || []).map(a => {
      if (String(a._id) !== req.params.answerId) return a;
      const votedBy = (a.votedBy || []).map(String);
      if (votedBy.includes(uid)) {
        return { ...a, votes: (a.votes || 0) - (dir || 1), votedBy: votedBy.filter(v => v !== uid) };
      }
      return { ...a, votes: (a.votes || 0) + (dir || 1), votedBy: [...votedBy, uid] };
    });
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    const updated = answers.find(a => String(a._id) === req.params.answerId);
    res.json({ votes: updated.votes, votedBy: updated.votedBy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Accept answer (post owner only) ──────────────────────────────────────────
exports.acceptAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (String(post.authorId) !== String(req.user.id))
      return res.status(403).json({ message: 'Only post author can accept answers' });
    const answers = (post.answers || []).map(a => ({
      ...a,
      accepted: String(a._id) === req.params.answerId ? !a.accepted : false,
    }));
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Edit answer (owner only) ────────────────────────────────────────────────
exports.editAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const answer = (post.answers || []).find(a => String(a._id) === req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    if (String(answer.authorId) !== String(req.user.id))
      return res.status(403).json({ message: 'Not authorized' });
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ message: 'body required' });
    const answers = post.answers.map(a =>
      String(a._id) === req.params.answerId ? { ...a, body: body.trim() } : a
    );
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── React to answer (emoji reactions) ──────────────────────────────────────
exports.reactAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const { emoji } = req.body;
    const ALLOWED = ['👍', '💡', '❤️', '🔥', '🎯'];
    if (!ALLOWED.includes(emoji)) return res.status(400).json({ message: 'Invalid emoji' });
    const uid = String(req.user.id);
    const answers = (post.answers || []).map(a => {
      if (String(a._id) !== req.params.answerId) return a;
      const reactions = { ...(a.reactions || {}) };
      const users = (reactions[emoji] || []).map(String);
      reactions[emoji] = users.includes(uid)
        ? users.filter(u => u !== uid)
        : [...users, uid];
      return { ...a, reactions };
    });
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    const updated = answers.find(a => String(a._id) === req.params.answerId);
    res.json({ reactions: updated.reactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete answer (owner or admin) ───────────────────────────────────────────
exports.deleteAnswer = async (req, res) => {
  try {
    const post = await db.Post_findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const answer = (post.answers || []).find(a => String(a._id) === req.params.answerId);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    if (String(answer.authorId) !== String(req.user.id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    const answers = post.answers.filter(a => String(a._id) !== req.params.answerId);
    await db.Post_findByIdAndUpdate(req.params.id, { answers });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
