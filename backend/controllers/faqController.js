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

// ── Mark FAQ helpful / not helpful ──────────────────────────────────────────
exports.markHelpful = async (req, res) => {
  try {
    const { type } = req.body; // 'helpful' | 'notHelpful'
    const field = type === 'helpful' ? 'helpful' : 'notHelpful';
    const faq = await db.FAQ_findByIdAndUpdate(req.params.id, { $inc: { [field]: 1 } }, { lean: false });
    if (!faq) return res.status(404).json({ message: 'FAQ not found' });
    res.json(faq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};