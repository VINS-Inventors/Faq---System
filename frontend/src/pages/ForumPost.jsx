import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '💡', label: 'Insightful' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎯', label: 'Spot on' },
];

// These two are always pinned next to upvote
const PINNED = ['👍', '💡'];

/* ── Upvote/downvote for the question ── */
const QuestionVote = ({ votes, votedBy, onVote }) => {
  const { user } = useAuth();
  const voted = (votedBy || []).map(String).includes(String(user?.id));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 36 }}>
      <button onClick={() => onVote(1)} className="btn btn-sm btn-secondary"
        style={{ padding: '2px 8px', background: voted ? 'var(--accent)' : '', color: voted ? '#fff' : '' }}>▲</button>
      <span style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 15 }}>{votes || 0}</span>
      <button onClick={() => onVote(-1)} className="btn btn-sm btn-secondary" style={{ padding: '2px 8px' }}>▼</button>
    </div>
  );
};

/* ── Emoji reaction bar for answers ── */
const ReactionBar = ({ votes, votedBy, reactions = {}, onVote, onReact }) => {
  const { user } = useAuth();
  const uid = String(user?.id);
  const upvoted = (votedBy || []).map(String).includes(uid);
  const [showPicker, setShowPicker] = useState(false);
  const [tooltip, setTooltip] = useState(null); // { emoji, names }
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!showPicker) return;
    const h = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showPicker]);

  const activeReactions = REACTIONS.filter(r => !PINNED.includes(r.emoji) && (reactions[r.emoji] || []).length > 0);
  const pinnedReactions = REACTIONS.filter(r => PINNED.includes(r.emoji));

  const PinnedBtn = ({ emoji, label }) => {
    const users = (reactions[emoji] || []).map(String);
    const reacted = users.includes(uid);
    const count = users.length;
    return (
      <div style={{ position: 'relative' }}
        onMouseEnter={() => setTooltip({ emoji, label, count })}
        onMouseLeave={() => setTooltip(null)}>
        <button
          onClick={() => onReact(emoji)}
          className="btn btn-sm"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: reacted ? 'rgba(118,56,250,0.18)' : 'var(--bg-4)',
            border: `1px solid ${reacted ? 'var(--accent)' : 'var(--border)'}`,
            color: reacted ? 'var(--text-strong)' : 'var(--text-muted)',
            borderRadius: 20, padding: '3px 12px', fontSize: 13,
            transition: 'all 180ms',
          }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
          {count > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: reacted ? 'var(--accent)' : 'var(--bg-3)',
              color: reacted ? '#fff' : 'var(--text-muted)',
              borderRadius: 10, padding: '0 5px', marginLeft: 2,
            }}>{count}</span>
          )}
        </button>
        {tooltip?.emoji === emoji && (
          <div style={{
            position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text)',
            whiteSpace: 'nowrap', zIndex: 60, pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            {label}{count > 0 ? ` · ${count} ${count === 1 ? 'person' : 'people'}` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>

      {/* Upvote */}
      <button onClick={() => onVote(1)} className="btn btn-sm" title="Upvote this answer"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: upvoted ? 'rgba(118,56,250,0.18)' : 'var(--bg-4)',
          border: `1px solid ${upvoted ? 'var(--accent)' : 'var(--border)'}`,
          color: upvoted ? 'var(--accent)' : 'var(--text-muted)',
          borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600,
        }}>
        ▲ <span>{votes || 0}</span>
      </button>

      {/* Pinned: Like + Insightful always visible */}
      {pinnedReactions.map(r => <PinnedBtn key={r.emoji} emoji={r.emoji} label={r.label} />)}

      {/* Divider */}
      <span style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />

      {/* Other active reaction chips (non-pinned, count > 0) */}
      {activeReactions.map(({ emoji, label }) => {
        const users = (reactions[emoji] || []).map(String);
        const reacted = users.includes(uid);
        const count = users.length;
        return (
          <div key={emoji} style={{ position: 'relative' }}>
            <button
              onClick={() => onReact(emoji)}
              onMouseEnter={() => setTooltip({ emoji, label, count })}
              onMouseLeave={() => setTooltip(null)}
              className="btn btn-sm"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: reacted ? 'rgba(118,56,250,0.18)' : 'var(--bg-4)',
                border: `1px solid ${reacted ? 'var(--accent)' : 'var(--border)'}`,
                color: reacted ? 'var(--text-strong)' : 'var(--text-muted)',
                borderRadius: 20, padding: '3px 10px', fontSize: 13,
                transition: 'all 180ms',
              }}>
              {emoji} <span style={{ fontSize: 11, fontWeight: 600 }}>{count}</span>
            </button>
            {tooltip?.emoji === emoji && (
              <div style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--text)',
                whiteSpace: 'nowrap', zIndex: 60, pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}>
                {label} · {count} {count === 1 ? 'person' : 'people'}
              </div>
            )}
          </div>
        );
      })}

      {/* Add more reactions (non-pinned only in picker) */}
      <div style={{ position: 'relative' }} ref={pickerRef}>
        <button onClick={() => setShowPicker(v => !v)} className="btn btn-sm btn-secondary"
          title="More reactions" style={{ borderRadius: 20, padding: '3px 10px', fontSize: 13 }}>
          😊 +
        </button>
        {showPicker && (
          <div style={{
            position: 'absolute', bottom: '110%', left: 0,
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 10px',
            display: 'flex', gap: 4, zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'reactionPop 150ms cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {REACTIONS.filter(r => !PINNED.includes(r.emoji)).map(({ emoji, label }) => {
              const reacted = (reactions[emoji] || []).map(String).includes(uid);
              return (
                <button key={emoji} title={label}
                  onClick={() => { onReact(emoji); setShowPicker(false); }}
                  style={{
                    fontSize: 20, background: reacted ? 'rgba(118,56,250,0.2)' : 'transparent',
                    border: `1px solid ${reacted ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: 8, padding: '4px 6px', cursor: 'pointer', lineHeight: 1,
                    transition: 'transform 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main page ── */
const ForumPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody]   = useState('');
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    api.get(`/posts/${id}`)
      .then(res => setPost(res.data))
      .catch(() => setError('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const votePost = async (dir) => {
    try {
      const res = await api.post(`/posts/${id}/vote`, { dir });
      setPost(p => ({ ...p, votes: res.data.votes, votedBy: res.data.votedBy }));
    } catch {}
  };

  const voteAnswer = async (answerId, dir) => {
    try {
      const res = await api.post(`/posts/${id}/answers/${answerId}/vote`, { dir });
      setPost(p => ({
        ...p,
        answers: p.answers.map(a => String(a._id) === String(answerId)
          ? { ...a, votes: res.data.votes, votedBy: res.data.votedBy } : a),
      }));
    } catch {}
  };

  const reactAnswer = async (answerId, emoji) => {
    try {
      const res = await api.post(`/posts/${id}/answers/${answerId}/react`, { emoji });
      setPost(p => ({
        ...p,
        answers: p.answers.map(a => String(a._id) === String(answerId)
          ? { ...a, reactions: res.data.reactions } : a),
      }));
    } catch {}
  };

  const acceptAnswer = async (answerId) => {
    try {
      await api.post(`/posts/${id}/answers/${answerId}/accept`);
      setPost(p => ({
        ...p,
        answers: p.answers.map(a => ({
          ...a, accepted: String(a._id) === String(answerId) ? !a.accepted : false,
        })),
      }));
    } catch {}
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${id}/answers`, { body: answerBody });
      setPost(p => ({ ...p, answers: [...(p.answers || []), res.data] }));
      setAnswerBody('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post answer');
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (answerId) => {
    if (!editBody.trim()) return;
    try {
      await api.put(`/posts/${id}/answers/${answerId}`, { body: editBody });
      setPost(p => ({
        ...p,
        answers: p.answers.map(a => String(a._id) === String(answerId) ? { ...a, body: editBody } : a),
      }));
      setEditingId(null);
    } catch {}
  };

  const deletePost = async () => {
    if (!confirm('Delete this question?')) return;
    try { await api.delete(`/posts/${id}`); navigate('/forum'); } catch {}
  };

  const deleteAnswer = async (answerId) => {
    if (!confirm('Delete this answer?')) return;
    try {
      await api.delete(`/posts/${id}/answers/${answerId}`);
      setPost(p => ({ ...p, answers: p.answers.filter(a => String(a._id) !== String(answerId)) }));
    } catch {}
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="app-wrapper"><Navbar />
      <div className="loading"><div className="spinner" /><span>Loading…</span></div>
    </div>
  );
  if (error || !post) return (
    <div className="app-wrapper"><Navbar />
      <div className="page-container"><div className="msg-error">{error || 'Post not found'}</div></div>
    </div>
  );

  const isOwner = String(post.authorId) === String(user?.id);
  const sortedAnswers = [...(post.answers || [])].sort((a, b) => {
    if (a.accepted && !b.accepted) return -1;
    if (!a.accepted && b.accepted) return 1;
    return (b.votes || 0) - (a.votes || 0);
  });

  return (
    <div className="app-wrapper">
      <Navbar />
      <style>{`
        @keyframes reactionPop {
          from { opacity:0; transform:scale(0.8) translateY(6px); }
          to   { opacity:1; transform:scale(1)   translateY(0);   }
        }
      `}</style>
      <div className="page-container" style={{ overflowY: 'auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/forum')}>← Forum</button>
          <button className="btn btn-secondary btn-sm" onClick={copyLink} title="Copy link">
            {copied ? '✓ Copied!' : '🔗 Share'}
          </button>
        </div>

        {/* Question card */}
        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="page-title" style={{ fontSize: 16, lineHeight: 1.4 }}>{post.title}</div>
              <div className="faq-item-meta" style={{ marginTop: 6 }}>
                <span>👤 {post.authorName}</span>
                <span className="faq-item-meta-sep">·</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                <span className="faq-item-meta-sep">·</span>
                <span>👁 {post.views || 0} views</span>
                <span className="faq-item-meta-sep">·</span>
                <span>💬 {sortedAnswers.length} answer{sortedAnswers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {(isOwner || user?.role === 'admin') && (
              <button className="btn btn-danger btn-sm" onClick={deletePost}>Delete</button>
            )}
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 'var(--s16)' }}>
            <QuestionVote votes={post.votes} votedBy={post.votedBy} onVote={votePost} />
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{post.body}</p>
              {post.tags?.length > 0 && (
                <div style={{ marginTop: 'var(--s12)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {post.tags.map(t => <span key={t} className="cat-pill">#{t}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answers header */}
        <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {sortedAnswers.length} Answer{sortedAnswers.length !== 1 ? 's' : ''}
          {sortedAnswers.some(a => a.accepted) && (
            <span className="status-badge status-answered">✓ Solved</span>
          )}
        </div>

        {/* Answer cards */}
        {sortedAnswers.map(answer => {
          const isAnswerOwner = String(answer.authorId) === String(user?.id);
          const isEditing = editingId === String(answer._id);

          return (
            <div key={answer._id} className="card"
              style={answer.accepted ? { borderColor: 'var(--green)', boxShadow: '0 0 0 1px rgba(3,127,3,0.15)' } : {}}>
              <div className="card-body" style={{ display: 'flex', gap: 'var(--s16)' }}>

                {/* Accept column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 28, paddingTop: 2 }}>
                  {isOwner ? (
                    <button title={answer.accepted ? 'Unaccept' : 'Mark as accepted answer'}
                      onClick={() => acceptAnswer(answer._id)}
                      style={{
                        fontSize: 22, background: 'none', border: 'none', cursor: 'pointer',
                        color: answer.accepted ? 'var(--green)' : 'var(--border)',
                        transition: 'color 200ms',
                      }}
                      onMouseEnter={e => { if (!answer.accepted) e.currentTarget.style.color = 'var(--green)'; }}
                      onMouseLeave={e => { if (!answer.accepted) e.currentTarget.style.color = 'var(--border)'; }}>
                      ✓
                    </button>
                  ) : answer.accepted ? (
                    <span style={{ fontSize: 22, color: 'var(--green)' }} title="Accepted answer">✓</span>
                  ) : null}
                </div>

                {/* Body */}
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea className="form-textarea" rows={4} value={editBody}
                        onChange={e => setEditBody(e.target.value)} autoFocus />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveEdit(answer._id)}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{answer.body}</p>
                  )}

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div className="faq-item-meta">
                      <span>👤 {answer.authorName}</span>
                      <span className="faq-item-meta-sep">·</span>
                      <span>{new Date(answer.createdAt).toLocaleString()}</span>
                      {answer.accepted && (
                        <span className="status-badge status-answered" style={{ marginLeft: 8 }}>✓ Accepted</span>
                      )}
                    </div>
                    {/* Edit / Delete */}
                    {!isEditing && (isAnswerOwner || user?.role === 'admin') && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isAnswerOwner && (
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => { setEditingId(String(answer._id)); setEditBody(answer.body); }}>
                            ✏️ Edit
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => deleteAnswer(answer._id)}>✕</button>
                      </div>
                    )}
                  </div>

                  {/* Reaction bar */}
                  {!isEditing && (
                    <ReactionBar
                      votes={answer.votes}
                      votedBy={answer.votedBy}
                      reactions={answer.reactions || {}}
                      onVote={(dir) => voteAnswer(answer._id, dir)}
                      onReact={(emoji) => reactAnswer(answer._id, emoji)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Answer form */}
        <div className="card card-padded" style={{ flexShrink: 0 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-strong)', marginBottom: 'var(--s12)' }}>
            Your Answer
          </div>
          <form onSubmit={submitAnswer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s12)' }}>
            <textarea className="form-textarea" rows={5} placeholder="Write your answer here…"
              value={answerBody} onChange={e => setAnswerBody(e.target.value)} required />
            {error && <div className="msg-error">{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Posting…' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ForumPost;
