import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const SORTS = [
  { key: 'newest', label: '🕐 Newest' },
  { key: 'votes',  label: '▲ Top Voted' },
  { key: 'active', label: '💬 Most Answered' },
];

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sort, setSort]         = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', body: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');

  const fetchPosts = async (q = '', tag = '') => {
    setLoading(true);
    try {
      const params = {};
      if (q)   params.q   = q;
      if (tag) params.tag = tag;
      const res = await api.get('/posts', { params });
      setPosts(res.data);
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchPosts(search, activeTag); };

  const handleTagClick = (tag) => {
    const next = activeTag === tag ? '' : tag;
    setActiveTag(next);
    fetchPosts(search, next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.post('/posts', { ...form, tags });
      navigate(`/forum/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...posts].sort((a, b) => {
    if (sort === 'votes')  return (b.votes || 0) - (a.votes || 0);
    if (sort === 'active') return (b.answerCount || 0) - (a.answerCount || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].slice(0, 14);
  const hasAccepted = (post) => post.hasAccepted;

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-title">💬 Community Forum</div>
            <div className="page-subtitle">{posts.length} question{posts.length !== 1 ? 's' : ''} · Ask anything, answer others</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(v => !v); setError(''); }}>
            {showForm ? '✕ Cancel' : '+ Ask Question'}
          </button>
        </div>

        {/* Ask form */}
        {showForm && (
          <div className="card card-padded" style={{ flexShrink: 0 }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s12)' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" placeholder="What's your question? Be specific." value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Details</label>
                <textarea className="form-textarea" placeholder="Describe your question in detail…" value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} required />
              </div>
              <div className="form-group">
                <label className="form-label">Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(comma-separated)</span></label>
                <input className="form-input" placeholder="e.g. react, node, mongodb" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              {error && <div className="msg-error">{error}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Posting…' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search + Sort row */}
        <div style={{ display: 'flex', gap: 'var(--s8)', flexShrink: 0, flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--s8)', flex: 1, minWidth: 200 }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <span className="search-bar-icon">🔍</span>
              <input placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-secondary" type="submit">Search</button>
          </form>
          <div style={{ display: 'flex', gap: 4 }}>
            {SORTS.map(s => (
              <button key={s.key}
                className={`filter-btn${sort === s.key ? ' active' : ''}`}
                onClick={() => setSort(s.key)}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="filter-bar" style={{ flexShrink: 0 }}>
            {allTags.map(tag => (
              <button key={tag} className={`filter-btn${activeTag === tag ? ' active' : ''}`}
                onClick={() => handleTagClick(tag)}>#{tag}</button>
            ))}
          </div>
        )}

        {/* Post list */}
        <div className="faq-list">
          {loading ? (
            <div className="loading"><div className="spinner" /><span>Loading…</span></div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <div className="empty-title">No questions yet</div>
              <div className="empty-desc">Be the first to ask something!</div>
            </div>
          ) : sorted.map(post => {
            const answered = (post.answerCount || 0) > 0;
            return (
              <Link key={post._id} to={`/forum/${post._id}`} style={{ textDecoration: 'none' }}>
                <div className="faq-item" style={post.hasAccepted ? { borderLeftColor: 'var(--green)' } : {}}>
                  <div className="faq-item-header">
                    <span className="faq-item-question">{post.title}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      {post.hasAccepted && (
                        <span className="status-badge status-answered" title="Has accepted answer">✓ Solved</span>
                      )}
                      <span className="status-badge"
                        style={answered
                          ? { background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid rgba(9,113,211,0.3)' }
                          : { background: 'var(--bg-4)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        💬 {post.answerCount}
                      </span>
                    </div>
                  </div>
                  <div className="faq-item-meta">
                    <span>👤 {post.authorName}</span>
                    <span className="faq-item-meta-sep">·</span>
                    <span>▲ {post.votes || 0}</span>
                    <span className="faq-item-meta-sep">·</span>
                    <span>👁 {post.views || 0}</span>
                    <span className="faq-item-meta-sep">·</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    {post.tags?.map(t => (
                      <span key={t} className="cat-pill" style={{ marginLeft: 4 }}>#{t}</span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Forum;
