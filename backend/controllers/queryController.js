const db = require('../config/db');

// ── User: submit a new query ─────────────────────────────────────────────────
exports.submitQuery = async (req, res) => {
  try {
    const { title, description, category, priority, attachments } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!description?.trim()) return res.status(400).json({ message: 'Description is required' });

    const query = await db.Query_create({
      userId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      category: category || 'General',
      priority: priority || 'MEDIUM',
      attachments: attachments || [],
      status: 'PENDING',
    });
    res.status(201).json(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Public: all RESOLVED/APPROVED queries (published FAQ board) ──────────────
exports.getBoard = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = { status: { $in: ['RESOLVED', 'APPROVED'] } };
    if (category && category !== 'All') filter.category = category;

    let queries = await db.Query_find(filter, { sort: { resolvedAt: -1 } });

    if (q?.trim()) {
      const search = q.trim().toLowerCase();
      queries = queries.filter(
        x => x.title?.toLowerCase().includes(search) ||
             x.description?.toLowerCase().includes(search) ||
             (x.answer && x.answer.toLowerCase().includes(search))
      );
    }

    const userIds = [...new Set(queries.map(x => x.userId))];
    const users = await db.User_find({});
    const userMap = {};
    users.forEach(u => { userMap[u._id] = { name: u.name }; });

    const result = queries.map(x => ({
      _id: x._id,
      title: x.title,
      description: x.description,
      answer: x.answer,
      category: x.category,
      priority: x.priority,
      askedBy: userMap[x.userId]?.name || 'Anonymous',
      viewCount: x.viewCount || 0,
      helpful: x.helpful || 0,
      resolvedAt: x.resolvedAt,
      createdAt: x.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── User: my own queries (all statuses, with full timeline) ─────────────────
exports.getMyQueries = async (req, res) => {
  try {
    const queries = await db.Query_find({ userId: req.user.id }, { sort: { createdAt: -1 } });
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderator/Admin: queries in REVIEWING status ────────────────────────────
exports.getReviewing = async (req, res) => {
  try {
    const queries = await db.Query_find({ status: 'REVIEWING' }, { sort: { createdAt: 1 } });
    const userIds = [...new Set(queries.map(x => x.userId))];
    const users = await db.User_find({});
    const userMap = {};
    users.forEach(u => { userMap[u._id] = { name: u.name, email: u.email }; });

    const result = queries.map(x => ({
      _id: x._id,
      title: x.title,
      description: x.description,
      category: x.category,
      priority: x.priority,
      answer: x.answer,
      userId: userMap[x.userId] || { name: 'Unknown', email: 'N/A' },
      assignedTo: x.assignedTo,
      linkedFAQs: x.linkedFAQs || [],
      createdAt: x.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: pending queue (PENDING queries awaiting first review) ─────────────
exports.getPending = async (req, res) => {
  try {
    const queries = await db.Query_find({ status: 'PENDING' }, { sort: { createdAt: 1 } });
    const users = await db.User_find({});
    const userMap = {};
    users.forEach(u => { userMap[u._id] = { name: u.name, email: u.email }; });

    const result = queries.map(x => ({
      _id: x._id,
      title: x.title,
      description: x.description,
      category: x.category,
      priority: x.priority,
      userId: userMap[x.userId] || { name: 'Unknown', email: 'N/A' },
      createdAt: x.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderator: claim a PENDING query → moves to REVIEWING ───────────────────
exports.claimQuery = async (req, res) => {
  try {
    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    if (query.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING queries can be claimed' });
    }

    const updated = await db.Query_findByIdAndUpdate(req.params.id, {
      status: 'REVIEWING',
      assignedTo: req.user.id,
    }, { lean: false });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Moderator: resolve a REVIEWING query → answer provided, status RESOLVED ─
exports.resolveQuery = async (req, res) => {
  try {
    const { answer, linkedFAQs } = req.body;
    if (!answer?.trim()) return res.status(400).json({ message: 'Answer is required' });

    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    if (query.status !== 'REVIEWING') {
      return res.status(400).json({ message: 'Only REVIEWING queries can be resolved' });
    }

    const updated = await db.Query_findByIdAndUpdate(req.params.id, {
      status: 'RESOLVED',
      answer: answer.trim(),
      resolvedAt: new Date().toISOString(),
      linkedFAQs: linkedFAQs || [],
    }, { lean: false });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: escalate a query back to moderators ───────────────────────────────
exports.escalateQuery = async (req, res) => {
  try {
    const { reason } = req.body;
    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    if (!['PENDING', 'REVIEWING'].includes(query.status)) {
      return res.status(400).json({ message: 'Cannot escalate this query' });
    }

    const updated = await db.Query_findByIdAndUpdate(req.params.id, {
      status: 'ESCALATED',
      escalationReason: reason?.trim() || null,
      assignedTo: null,
    }, { lean: false });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: final approval of a RESOLVED query ───────────────────────────────
exports.approveQuery = async (req, res) => {
  try {
    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    if (query.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Only RESOLVED queries can be approved' });
    }

    // Create a published FAQ from the approved query
    await db.FAQ_create({
      question: query.title,
      answer: query.answer,
      category: query.category,
      createdBy: req.user.id,
      relatedQueries: [query._id],
    });

    const updated = await db.Query_findByIdAndUpdate(req.params.id, {
      status: 'APPROVED',
      approvedBy: req.user.id,
    }, { lean: false });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: reject a query ────────────────────────────────────────────────────
exports.rejectQuery = async (req, res) => {
  try {
    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });

    const updated = await db.Query_findByIdAndUpdate(req.params.id, {
      status: 'REJECTED',
      escalationReason: req.body.reason?.trim() || null,
    }, { lean: false });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: all escalated queries ─────────────────────────────────────────────
exports.getEscalated = async (req, res) => {
  try {
    const queries = await db.Query_find({ status: 'ESCALATED' }, { sort: { updatedAt: -1 } });
    const users = await db.User_find({});
    const userMap = {};
    users.forEach(u => { userMap[u._id] = { name: u.name, email: u.email }; });
    const result = queries.map(x => ({
      _id: x._id,
      title: x.title,
      description: x.description,
      category: x.category,
      priority: x.priority,
      answer: x.answer,
      escalationReason: x.escalationReason,
      userId: userMap[x.userId] || { name: 'Unknown', email: 'N/A' },
      createdAt: x.createdAt,
      updatedAt: x.updatedAt,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single query detail ──────────────────────────────────────────────────
exports.getQueryById = async (req, res) => {
  try {
    const query = await db.Query_findById(req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });

    // Increment view count
    await db.Query_findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { lean: false });

    const user = await db.User_findById(query.userId);
    const assignee = query.assignedTo ? await db.User_findById(query.assignedTo) : null;

    res.json({
      ...query,
      userId: user ? { name: user.name, email: user.email } : { name: 'Unknown' },
      assignedTo: assignee ? { name: assignee.name } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};