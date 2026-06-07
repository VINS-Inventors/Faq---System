import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const STATUS_LABELS = {
  PENDING: 'Pending',
  REVIEWING: 'In Review',
  RESOLVED: 'Resolved',
  APPROVED: 'Published',
  ESCALATED: 'Escalated',
  REJECTED: 'Rejected',
};

const AskQuery = () => {
  const [form, setForm] = useState({ title: '', description: '', category: 'General', priority: 'MEDIUM' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [myQueries, setMyQueries] = useState([]);
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/queries/mine')
      .then(res => setMyQueries(res.data))
      .catch(() => {})
      .finally(() => setLoadingQueries(false));
  }, [success]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/queries', form);
      setSuccess(true);
      setForm({ title: '', description: '', category: 'General', priority: 'MEDIUM' });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = d => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const statusClass = s => {
    const map = { PENDING: 'status-pending', REVIEWING: 'status-pending', RESOLVED: 'status-answered', APPROVED: 'status-answered', ESCALATED: 'status-pending', REJECTED: 'status-rejected' };
    return map[s] || 'status-pending';
  };

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container" style={{ overflowY: 'auto' }}>
        <div className="page-header">
          <div>
            <div className="page-title">📝 Ask a Question</div>
            <div className="page-subtitle">Submit a query — it moves through review → resolution → approval</div>
          </div>
          <Link to="/board"><button className="btn btn-secondary btn-sm">📖 FAQ Board</button></Link>
        </div>

        {/* Submit Card */}
        <div className="card" style={{ flexShrink: 0 }}>
          <div className="card-body">
            {success && (
              <div className="msg-success" style={{ marginBottom: '16px' }}>
                ✅ Query submitted! A moderator will review it shortly.
              </div>
            )}
            {error && <div className="msg-error" style={{ marginBottom: '16px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    name="title"
                    type="text"
                    className="form-input"
                    placeholder="Short summary of your question"
                    value={form.title}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                    <option>General</option>
                    <option>Technical</option>
                    <option>Feature</option>
                    <option>Bug</option>
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    placeholder="Describe your issue or question in detail..."
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    style={{ minHeight: '120px' }}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Priority</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius)', border: form.priority === p ? '1px solid var(--accent)' : '1px solid var(--border)', background: form.priority === p ? 'rgba(118,56,250,0.1)' : 'transparent', transition: 'var(--transition)' }}>
                        <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={handleChange} style={{ accentColor: 'var(--accent)' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600, color: p === 'HIGH' ? 'var(--red)' : p === 'MEDIUM' ? 'var(--yellow)' : 'var(--text-muted)' }}>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim() || !form.description.trim()}>
                {submitting ? '⏳ Submitting...' : '📤 Submit Query'}
              </button>
            </form>
          </div>
        </div>

        {/* My Queries */}
        <div className="my-queries-section" style={{ flexShrink: 0 }}>
          <div className="my-queries-title">My Queries ({myQueries.length})</div>

          {loadingQueries ? (
            <div className="loading"><div className="spinner" /><span>Loading...</span></div>
          ) : myQueries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <div className="empty-title">No queries yet</div>
              <div className="empty-desc">Your submitted questions will appear here with their status.</div>
            </div>
          ) : (
            <div>
              {myQueries.slice(0, 15).map(q => (
                <div key={q._id} className="query-item" onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className={`status-badge ${statusClass(q.status)}`}>{STATUS_LABELS[q.status] || q.status}</span>
                    <span className="cat-pill">{q.category}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {q.priority !== 'MEDIUM' && <span style={{ color: q.priority === 'HIGH' ? 'var(--red)' : 'var(--text-muted)', fontWeight: 600 }}>[{q.priority}]</span>}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(q.createdAt)}</span>
                  </div>
                  <div className="query-item-q" style={{ fontWeight: 600, marginBottom: '4px' }}>{q.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{q.description?.slice(0, 120)}{q.description?.length > 120 ? '...' : ''}</div>

                  {expandedId === q._id && (
                    <div style={{ marginTop: '12px' }}>
                      {q.answer && (
                        <div className="query-item-answer">
                          <strong>Answer: </strong>{q.answer}
                        </div>
                      )}
                      {q.escalationReason && (
                        <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--yellow-bg)', border: '1px solid rgba(178,145,28,0.3)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--yellow)' }}>
                          ⚠ Escalation: {q.escalationReason}
                        </div>
                      )}
                      {q.status === 'REVIEWING' && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>⏳ A moderator is reviewing your query.</div>
                      )}
                      {q.status === 'APPROVED' && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--green)' }}>🎉 Your query was published as an FAQ!</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskQuery;