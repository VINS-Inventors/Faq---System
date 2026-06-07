import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ── helpers ──────────────────────────────────────────────────────────────────
const getInitials = s => s ? s.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

const timeAgo = ts => {
  if (!ts) return '';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

// ── Answer expandable card ───────────────────────────────────────────────────
const FAQItem = ({ faq, onVote, userVote }) => {
  const [open, setOpen] = useState(false);

  return (
    <article className={`faq-item${open ? ' faq-item--active' : ''}`}>
      <button
        className="faq-item-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <div className="faq-item-qrow">
          <span className="faq-category-badge">{faq.category || 'General'}</span>
          <span className="faq-item-question">{faq.question}</span>
        </div>
        <span className={`faq-chevron${open ? ' faq-chevron--open' : ''}`}>▾</span>
      </button>

      <div
        className="faq-answer-wrapper"
        style={{ maxHeight: open ? '600px' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="faq-answer-body">
          <p className="faq-item-answer">{faq.answer}</p>

          {faq.tags?.length > 0 && (
            <div className="faq-tags">
              {faq.tags.map(tag => (
                <span key={tag} className="faq-tag">#{tag}</span>
              ))}
            </div>
          )}

          <div className="faq-voting">
            <span className="faq-vote-label">Was this helpful?</span>
            <button
              className={`faq-vote-btn${userVote === 'helpful' ? ' voted' : ''}`}
              onClick={e => { e.stopPropagation(); onVote(faq._id, 'helpful'); }}
            >
              👍 Helpful
              {faq.helpful > 0 && <span className="faq-vote-count">{faq.helpful}</span>}
            </button>
            <button
              className={`faq-vote-btn vote-down${userVote === 'notHelpful' ? ' voted' : ''}`}
              onClick={e => { e.stopPropagation(); onVote(faq._id, 'notHelpful'); }}
            >
              👎 Not Helpful
              {faq.notHelpful > 0 && <span className="faq-vote-count">{faq.notHelpful}</span>}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

// ── Main FAQ page ─────────────────────────────────────────────────────────────
export default function FAQ() {
  const { user } = useAuth();
  const [faqs, setFaqs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [submittingVote, setSubmittingVote] = useState(null);

  const fetchFAQs = useCallback(async (q = search, cat = category) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (q.trim()) params.q = q.trim();
      if (cat && cat !== 'All') params.category = cat;
      const res = await api.get('/faqs', { params });
      const list = Array.isArray(res.data) ? res.data : (res.data?.faqs || []);
      console.log('[FAQ] response status:', res.status, 'data type:', typeof res.data, 'list len:', list.length);
      setFaqs(list);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchFAQs(); }, []);

  // Build category list when FAQs load
  useEffect(() => {
    const cats = ['All'];
    faqs.forEach(f => { if (f.category && !cats.includes(f.category)) cats.push(f.category); });
    setCategories(cats);
  }, [faqs]);

  // Sync user votes from FAQs data
  useEffect(() => {
    if (!user || faqs.length === 0) return;
    const votes = {};
    const userId = String(user.id || user._id);
    faqs.forEach(f => {
      const helpfulVotes = Array.isArray(f.helpfulVotes) ? f.helpfulVotes.map(String) : [];
      const notHelpfulVotes = Array.isArray(f.notHelpfulVotes) ? f.notHelpfulVotes.map(String) : [];
      if (helpfulVotes.includes(userId)) {
        votes[f._id] = 'helpful';
      } else if (notHelpfulVotes.includes(userId)) {
        votes[f._id] = 'notHelpful';
      }
    });
    setUserVotes(votes);
  }, [faqs, user]);

  const handleSearch = e => {
    e.preventDefault();
    fetchFAQs(search, category);
  };

  const handleCategoryChange = cat => {
    setCategory(cat);
    fetchFAQs(search, cat);
  };

  const handleVote = async (faqId, type) => {
    if (!user) {
      alert('Please log in to vote on FAQs.');
      return;
    }
    if (submittingVote) return;
    setSubmittingVote(faqId);
    try {
      const res = await api.post(`/faqs/${faqId}/helpful`, { type });
      const updatedFaq = res.data;
      
      // Update the voted FAQ in state
      setFaqs(prev => prev.map(f => f._id === faqId ? updatedFaq : f));
      
      // Determine user vote state from backend response
      const userId = String(user.id || user._id);
      const helpfulVotes = Array.isArray(updatedFaq.helpfulVotes) ? updatedFaq.helpfulVotes.map(String) : [];
      const notHelpfulVotes = Array.isArray(updatedFaq.notHelpfulVotes) ? updatedFaq.notHelpfulVotes.map(String) : [];
      
      setUserVotes(prev => {
        const next = { ...prev };
        if (helpfulVotes.includes(userId)) {
          next[faqId] = 'helpful';
        } else if (notHelpfulVotes.includes(userId)) {
          next[faqId] = 'notHelpful';
        } else {
          delete next[faqId];
        }
        return next;
      });
    } catch (err) {
      console.error('[FAQ] Vote failed:', err);
    } finally {
      setSubmittingVote(null);
    }
  };

  return (
    <div className="app-wrapper">
      <Navbar />
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s24)', display: 'flex', flexDirection: 'column', gap: 'var(--s16)' }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <div className="page-title">📖 Frequently Asked Questions</div>
            <div className="page-subtitle">
              {faqs.length} answer{faqs.length !== 1 ? 's' : ''} available
              {category !== 'All' && ` in "${category}"`}
            </div>
          </div>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <form className="faq-search-row" onSubmit={handleSearch}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 520 }}>
            <span className="search-bar-icon">🔍</span>
            <input
              placeholder="Search questions or answers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          {(search || category !== 'All') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setSearch(''); setCategory('All'); fetchFAQs('', 'All'); }}
            >
              Clear
            </button>
          )}
        </form>

        {/* ── Category pills ─────────────────────────────────────────────── */}
        {categories.length > 1 && (
          <div className="faq-category-row">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`faq-cat-pill${category === cat ? ' active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && <div className="msg-error">{error}</div>}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading FAQs…</span>
          </div>
        ) : faqs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No FAQs found</div>
            <div className="empty-desc">
              {search ? `No results for "${search}". Try different keywords.` : 'No FAQs available yet. Check back later.'}
            </div>
            {(search || category !== 'All') && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => { setSearch(''); setCategory('All'); fetchFAQs('', 'All'); }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Sort hint */}
            <div className="faq-count-row">
              <span>
                Showing <strong>{faqs.length}</strong> question{faqs.length !== 1 ? 's' : ''}
                {search && <> for "<em>{search}</em>"</>}
              </span>
            </div>

            {/* FAQ list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {faqs.map(faq => (
                <FAQItem
                  key={faq._id}
                  faq={faq}
                  onVote={handleVote}
                  userVote={userVotes[faq._id]}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}