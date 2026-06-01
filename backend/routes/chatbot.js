const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// POST /api/chatbot/message — send a message and get a response
// Works for both guests and logged-in users
router.post('/message', chatbotController.message);

// POST /api/chatbot/ticket — create a support ticket from the chatbot
router.post('/ticket', chatbotController.createTicket);

// Internal: proxy LLM call to vLLM server
router.post('/llm', async (req, res) => {
  try {
    const response = await fetch('http://0.0.0.0:6006/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY || 'lm-studio'}`,
      },
      body: JSON.stringify({
        model: 'local-model',
        messages: req.body.messages || [{ role: 'user', content: req.body.prompt }],
        max_tokens: 300,
        temperature: 0.4,
      }),
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I had trouble generating a response.';
    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error('LLM proxy error:', err);
    res.status(500).json({ reply: "I'm having trouble connecting to my brain right now. Please try again in a moment." });
  }
});

module.exports = router;