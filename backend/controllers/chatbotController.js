const db = require('../config/db');

const GREETINGS = ['hi', 'hello', 'hey', 'sup'];
const THANK_RE = /thank|thanks|thx|ty/i;
const CLOSING_RE = /bye|goodbye|see you|done|exit|close/i;
const TICKET_RE = /create.*ticket|raise.*ticket|new.*issue|report.*problem|open.*ticket|submit.*ticket/i;
const TICKET_PROMPTS = ['create a ticket', 'raise a ticket', 'i want to submit a query', 'i have an issue', 'open a support ticket', 'file a complaint', 'register a problem'];

function isGreeting(text) {
  return GREETINGS.some(g => text.toLowerCase().trim() === g || text.toLowerCase().startsWith(g + ' '));
}

const STOP_WORDS = new Set(['what','is','the','a','an','of','in','for','to','how','do','i','my','can','will','are','was','does','it','me','we','our','your','you','at','on','with','and','or','if','be','this','that','have','has','get','not','by']);

function scoreMatch(text, query) {
  if (!text || !query) return 0;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  let score = 0;
  if (t === q) score += 50;
  else if (t.startsWith(q)) score += 30;
  else if (t.includes(q)) score += 20;
  // Only score non-stop content words
  const qWords = q.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
  if (!qWords.length) return score;
  const tWords = t.split(/\s+/);
  qWords.forEach(w => {
    tWords.forEach(tw => {
      if (tw === w) score += 6;
      else if (tw.startsWith(w) && w.length > 3) score += 3;
      else if (tw.includes(w) && w.length > 4) score += 1;
    });
  });
  return score;
}

async function searchKB(query) {
  // db.init() is called once at server startup — no need to re-call per request
  let faqs = [], queries = [];
  try {
    [faqs, queries] = await Promise.all([
      db.FAQ_find({}, { sort: { helpful: -1 } }),
      db.Query_find({ status: 'RESOLVED' }, { sort: { helpful: -1 } }),
    ]);
  } catch (e) {
    console.warn('KB search error:', e.message);
  }

  const scored = [
    ...faqs.map(f => ({
      score: scoreMatch(f.question, query) + scoreMatch(f.answer, query) * 0.7,
      type: 'faq', data: f,
    })),
    ...queries.map(q => ({
      score: scoreMatch(q.title, query) + scoreMatch(q.answer, query) * 0.7,
      type: 'query', data: q,
    })),
  ];

  return scored.filter(r => r.score > 5).sort((a, b) => b.score - a.score).slice(0, 4);
}

function formatReply(results) {
  if (!results.length) return null;
  const top = results[0];
  if (top.type === 'faq') {
    const a = top.data.answer?.trim();
    if (!a) return null;
    return a.length > 300 ? a.slice(0, 297) + '…' : a;
  }
  const a = top.data.answer?.trim();
  if (!a) return null;
  const prefix = top.data.title ? `Based on a similar resolved query ("${top.data.title}"): ` : '';
  const text = a.length > 250 ? prefix + a.slice(0, 247) + '…' : prefix + a;
  return text;
}

function buildSuggestions(results) {
  if (!results.length) return null;
  const others = results.slice(0, 3).map(r =>
    r.type === 'faq' ? r.data.question : r.data.title
  );
  if (!others.length) return null;
  return `Here are some related topics you might find helpful:\n${others.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}

// POST /api/chatbot/message
exports.message = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Message is required' });

    const text = message.trim();

    // Handle known intent patterns
    const lower = text.toLowerCase();

    if (TICKET_RE.test(lower) || TICKET_PROMPTS.some(p => lower.includes(p))) {
      return res.json({
        reply: "Sure! I can help you create a support ticket. Please fill in the details using the 🎫 Create Ticket button that appeared below, or tell me:\n\n1. What is the issue about?\n2. Describe the problem in detail.\n3. Your email address (optional).",
        action: 'ticket',
      });
    }

    if (CLOSING_RE.test(lower)) {
      return res.json({ reply: "Happy to help! Feel free to come back anytime. Have a great day! 👋" });
    }

    if (isGreeting(text)) {
      return res.json({
        reply: "Hey there! 👋 I'm your T&P FAQ assistant at IIT Ropar. I can help you with:\n\n• Internships & placements\n• Company visits & eligibility\n• Application status\n• T&P process & deadlines\n\nWhat would you like to know?",
      });
    }

    if (THANK_RE.test(lower)) {
      return res.json({ reply: "You're welcome! 😊 Is there anything else I can help you with?" });
    }

    // KB search
    const results = await searchKB(text);
    const reply = formatReply(results);

    if (reply) {
      // Check if score is high enough to be confident
      const topScore = results[0]?.score || 0;
      if (topScore < 5) {
        return res.json({
          reply: `I'm not confident I have an exact answer for that. Here are the closest FAQs I found:\n\n${results.slice(0,3).map((r,i) => `${i+1}. ${r.type === 'faq' ? r.data.question : r.data.title}`).join('\n')}\n\nWould you like to create a support ticket for your specific question?`,
          action: 'ticket',
        });
      }
      const suggestions = buildSuggestions(results.slice(1));
      return res.json({
        reply: suggestions ? `${reply}\n\n─────\n${suggestions}` : reply,
      });
    }

    // No match at all — strict FAQ-only response
    return res.json({
      reply: "I can only answer questions from our FAQ knowledge base about the VINS internship programme. I don't have information about that topic.\n\nYou can:\n1. Try rephrasing your question\n2. Browse FAQs at /faq\n3. Create a support ticket using the 🎫 button",
      action: 'ticket',
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ message: 'Failed to generate response' });
  }
};

// POST /api/chatbot/ticket
exports.createTicket = async (req, res) => {
  try {
    const { title, description, email, userId } = req.body;
    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    await db.init();
    const query = await db.Query_create({
      title: title.trim(),
      description: description.trim(),
      userId: userId || 'anonymous',
      status: 'PENDING',
      priority: 'MEDIUM',
      category: 'General',
    });
    res.status(201).json({
      message: 'Ticket created! Our team will get back to you soon.',
      ticket: { _id: query._id, title: query.title },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};