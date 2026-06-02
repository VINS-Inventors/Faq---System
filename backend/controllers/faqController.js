const db = require('../config/db');

// ── Create FAQ (admin only) ───────────────────────────────────────────────────
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }
    const faq = await db.FAQ_create({
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'General',
      tags: tags || [],
      createdBy: req.user.id,
    });
    res.status(201).json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all published FAQs ───────────────────────────────────────────────────
exports.getAllFAQs = async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};
    if (category && category !== 'All') filter.category = category;

    let faqs = await db.FAQ_find(filter, { sort: { createdAt: -1 } });

    if (q && q.trim()) {
      const search = q.trim().toLowerCase();
      faqs = faqs.filter(
        f => f.question.toLowerCase().includes(search) ||
             f.answer.toLowerCase().includes(search) ||
             (f.tags && f.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get single FAQ ───────────────────────────────────────────────────────────
exports.getFAQById = async (req, res) => {
  try {
    const faq = await db.FAQ_findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    // Increment view count
    await db.FAQ_findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }, { lean: false });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update FAQ ───────────────────────────────────────────────────────────────
exports.updateFAQ = async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;
    const update = {};
    if (question) update.question = question.trim();
    if (answer) update.answer = answer.trim();
    if (category) update.category = category;
    if (tags) update.tags = tags;
    update.updatedBy = req.user.id;

    const faq = await db.FAQ_findByIdAndUpdate(req.params.id, update, { lean: false });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Delete FAQ ───────────────────────────────────────────────────────────────
exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await db.FAQ_findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Mark FAQ helpful / not helpful (per-user vote tracking) ─────────────────
exports.markHelpful = async (req, res) => {
  try {
    const { type } = req.body; // 'helpful' | 'notHelpful'
    if (!['helpful', 'notHelpful'].includes(type)) {
      return res.status(400).json({ message: "type must be 'helpful' or 'notHelpful'" });
    }

    const faq = await db.FAQ_findById(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });

    const uid = String(req.user.id);
    const helpfulVotes = Array.isArray(faq.helpfulVotes) ? faq.helpfulVotes.map(String) : [];
    const notHelpfulVotes = Array.isArray(faq.notHelpfulVotes) ? faq.notHelpfulVotes.map(String) : [];

    let updated;
    if (type === 'helpful') {
      if (helpfulVotes.includes(uid)) {
        // Toggle off
        updated = await db.FAQ_findByIdAndUpdate(req.params.id, {
          helpfulVotes: helpfulVotes.filter(v => v !== uid),
          helpful: Math.max(0, (faq.helpful || 0) - 1),
        });
      } else {
        // Vote on (remove from opposite if present)
        updated = await db.FAQ_findByIdAndUpdate(req.params.id, {
          helpfulVotes: [...helpfulVotes, uid],
          notHelpfulVotes: notHelpfulVotes.filter(v => v !== uid),
          helpful: (faq.helpful || 0) + 1,
          notHelpful: Math.max(0, (faq.notHelpful || 0) - (notHelpfulVotes.includes(uid) ? 1 : 0)),
        });
      }
    } else {
      if (notHelpfulVotes.includes(uid)) {
        updated = await db.FAQ_findByIdAndUpdate(req.params.id, {
          notHelpfulVotes: notHelpfulVotes.filter(v => v !== uid),
          notHelpful: Math.max(0, (faq.notHelpful || 0) - 1),
        });
      } else {
        updated = await db.FAQ_findByIdAndUpdate(req.params.id, {
          notHelpfulVotes: [...notHelpfulVotes, uid],
          helpfulVotes: helpfulVotes.filter(v => v !== uid),
          notHelpful: (faq.notHelpful || 0) + 1,
          helpful: Math.max(0, (faq.helpful || 0) - (helpfulVotes.includes(uid) ? 1 : 0)),
        });
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};