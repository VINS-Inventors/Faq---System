const db = require('../config/db');

// ── Post a discussion message ────────────────────────────────────────────────
exports.postMessage = async (req, res) => {
  try {
    const { queryId, message, attachments } = req.body;
    if (!queryId || !message?.trim()) {
      return res.status(400).json({ message: 'queryId and message are required' });
    }
    const forum = await db.Forum_create({
      queryId,
      userId: req.user.id,
      message: message.trim(),
      attachments: attachments || [],
    });
    res.status(201).json(forum);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all messages for a query ─────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const messages = await db.Forum_find({ queryId: req.params.queryId }, { sort: { createdAt: 1 } });

    // Attach user names — batch fetch only the userIds we need
    const userIds = [...new Set(messages.map(m => m.userId))];
    const userMap = {};
    if (userIds.length > 0) {
      const users = await db.User_find({ _id: { $in: userIds } });
      users.forEach(u => { userMap[u._id] = { name: u.name }; });
    }

    const result = messages.map(m => ({
      _id: m._id,
      queryId: m.queryId,
      message: m.message,
      likes: m.likes,
      attachments: m.attachments,
      createdAt: m.createdAt,
      user: userMap[m.userId] || { name: 'Unknown' },
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update a message (own messages only) ─────────────────────────────────────
exports.updateMessage = async (req, res) => {
  try {
    if (!req.body.message?.trim()) return res.status(400).json({ message: 'Message is required' });

    // Atomic find-and-update with ownership check — no separate lookup
    const updated = await db.Forum_findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { message: req.body.message.trim() }
    );
    if (!updated) return res.status(404).json({ message: 'Message not found or not yours' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete a message (owner or admin) ───────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  try {
    const forum = await db.Forum_findById(req.params.id);
    if (!forum) return res.status(404).json({ message: 'Message not found' });
    if (forum.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await db.Forum_findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};