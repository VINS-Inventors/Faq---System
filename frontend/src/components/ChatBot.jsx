import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const WELCOME = {
  reply: "Hey there! 👋 I'm your T&P FAQ assistant. Ask me anything about internships, placements, companies, eligibility, or deadlines — or describe your issue and I'll help find an answer.",
};

const SUGGESTIONS = [
  'How to apply for internships?',
  'What is the placement process?',
  'When do companies visit campus?',
  'Eligibility criteria for placements',
  'How to check my application status?',
  'Contact T&P office',
];

const TicketModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ title, description: desc, email });
      setDone(true);
      setTimeout(onClose, 1800);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 'inherit', backdropFilter: 'blur(4px)', zIndex: 10,
    }}>
      <div style={{
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: '90%', maxWidth: 340,
        boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 15 }}>Ticket Created!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>We'll get back to you soon.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14 }}>Create Support Ticket</span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title *" required
                style={inputStyle} />
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your issue *" required
                rows={3} style={{ ...inputStyle, resize: 'none' }} />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email (optional)"
                type="email" style={inputStyle} />
              <button type="submit" disabled={submitting} style={{
                padding: '10px', borderRadius: 8, border: 'none',
                background: submitting ? 'var(--bg-4)' : 'var(--accent)',
                color: '#000', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'var(--transition)',
              }}>
                {submitting ? 'Creating…' : 'Submit Ticket'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '9px 12px', borderRadius: 8,
  border: '1px solid var(--border-light)', background: 'var(--bg-input)',
  color: 'var(--text)', fontSize: 13, outline: 'none', width: '100%',
  transition: 'var(--transition)',
};

const TypingBubble = () => (
  <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)',
        animation: `bounce 1.2s ${i * 0.15}s infinite ease-in-out`,
      }} />
    ))}
  </div>
);

const ChatMessage = ({ msg }) => {
  const isBot = msg.role === 'assistant';
  return (
    <div style={{
      display: 'flex', justifyContent: isBot ? 'flex-start' : 'flex-end',
      animation: 'fadeUp 0.25s ease',
    }}>
      <div style={{
        maxWidth: '80%', padding: '9px 13px', borderRadius: 14,
        background: isBot ? 'var(--bg-4)' : 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
        color: isBot ? 'var(--text)' : '#000', fontSize: 13, lineHeight: 1.55,
        borderBottomLeftRadius: isBot ? 4 : 14,
        borderBottomRightRadius: isBot ? 14 : 4,
        fontWeight: isBot ? 400 : 600,
      }}>
        {msg.text}
      </div>
    </div>
  );
};

const ChatBot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [noAnswerCount, setNoAnswerCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: text.trim(),
        history: messages.filter(m => m.role),
      });
      const reply = res.data.reply || "I couldn't find a good answer. Let me connect you with a human.";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

      // Detect low-quality responses
      const lowQuality = reply.includes("couldn't find") || reply.includes("don't know") ||
        reply.includes("don't have that information") || reply.includes("connect you with a human");
      if (lowQuality) setNoAnswerCount(c => c + 1);
      if (noAnswerCount >= 1 || lowQuality) setShowTicket(true);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Oops, something went wrong. You can still create a support ticket below 👇",
      }]);
      setShowTicket(true);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, noAnswerCount]);

  const handleTicketSubmit = async (data) => {
    await api.post('/chatbot/ticket', { ...data, userId: user?._id });
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes pulse-ring { 0% { transform: scale(0.85); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }
      `}</style>

      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 9998,
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
            border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(153,255,0,0.35)',
            transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1), box-shadow 300ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(153,255,0,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(153,255,0,0.35)'; }}
        >
          <span style={{ fontSize: 26 }}>💬</span>
          {/* Pulse ring */}
          <span style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
            animation: 'pulse-ring 2s ease-out infinite', zIndex: -1,
          }} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 380, height: 560, maxHeight: '80vh',
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(153,255,0,0.08)',
          overflow: 'hidden',
          animation: 'fadeUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, var(--bg-3), var(--bg-2))',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                boxShadow: '0 0 20px rgba(153,255,0,0.3)',
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-strong)' }}>Yaksha</div>
                <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }} />
                  Online — typically replies instantly
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowTicket(true)}
                title="Create support ticket"
                style={{
                  background: 'var(--bg-4)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '6px 10px', color: 'var(--text-muted)',
                  fontSize: 12, cursor: 'pointer', transition: 'var(--transition)',
                }}
              >🎫 Ticket</button>
              <button
                onClick={() => { setOpen(false); setMessages([WELCOME]); setNoAnswerCount(0); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
                }}
              >×</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
            {loading && <TypingBubble />}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {!loading && messages.length <= 2 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{
                  padding: '5px 11px', borderRadius: 999,
                  border: '1px solid var(--border)', background: 'var(--bg-4)',
                  color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                  transition: 'var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-strong)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 14px', borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
              placeholder="Ask about T&P, internships, placements…"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 999,
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text)', fontSize: 13, outline: 'none',
                transition: 'var(--transition)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, var(--accent), var(--accent-mid))'
                  : 'var(--bg-4)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
                fontSize: 16,
              }}
            >{loading ? '…' : '➤'}</button>
          </div>

          {/* Ticket modal overlay */}
          {showTicket && (
            <TicketModal
              onClose={() => setShowTicket(false)}
              onSubmit={handleTicketSubmit}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;