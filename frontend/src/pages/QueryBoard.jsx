import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const QueryBoard = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (category !== 'All') params.set('category', category);
    api.get(`/queries/board?${params}`)
      .then(res => setFaqs(res.data))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch, category]);

  const categories = ['All', 'General', 'Technical', 'Feature', 'Bug'];

  const formatDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-title">📖 FAQ Board</div>
            <div className="page-subtitle">Published questions and answers — RESOLVED & APPROVED</div>
          </div>
          <Link to="/ask"><button className="btn btn-primary btn-sm">+ Ask a Question</button></Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input type="text" placeholder="Search questions or answers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar">
            {categories.map(c => (
              <button key={c} className={`filter-btn ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        {loading ? (
          <div className="loading"><div className="spinner" /><span>Loading FAQs...</span></div>
        ) : faqs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">{search || category !== 'All' ? 'No results found' : 'No FAQs yet'}</div>
            <div className="empty-desc">
              {search || category !== 'All' ? 'Try different search terms.' : 'Be the first to ask a question!'}
            </div>
            {!search && category === 'All' && (
              <Link to="/ask"><button className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>Ask a Question</button></Link>
            )}
          </div>
        ) : (
          <div className="faq-list">
            {faqs.map(faq => (
              <div key={faq._id} className="faq-item" onClick={() => setExpandedId(expandedId === faq._id ? null : faq._id)}>
                <div className="faq-item-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, flexWrap: 'wrap' }}>
                    <span className="cat-pill">{faq.category}</span>
                    <span className="faq-item-question">{faq.title}</span>
                  </div>
                  <span className="faq-item-meta">
                    {faq.viewCount > 0 && <span title="Views">👁 {faq.viewCount} · </span>}
                    Asked by {faq.askedBy} · {formatDate(faq.resolvedAt || faq.createdAt)}
                    <span style={{ marginLeft: '8px', opacity: 0.6 }}>{expandedId === faq._id ? '▲' : '▼'}</span>
                  </span>
                </div>

                {expandedId === faq._id && (
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.6 }}>
                      {faq.description}
                    </div>
                    <div className="faq-item-answer">{faq.answer}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      {faq.helpful > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--green)' }}>👍 {faq.helpful} found this helpful</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryBoard;