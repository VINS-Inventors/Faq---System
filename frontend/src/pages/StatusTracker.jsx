import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const STATUS_FLOW = ['PENDING', 'REVIEWING', 'RESOLVED', 'APPROVED'];
const STATUS_LABELS = {
  PENDING: 'Pending',
  REVIEWING: 'In Review',
  RESOLVED: 'Resolved',
  APPROVED: 'Published',
  ESCALATED: 'Escalated',
  REJECTED: 'Rejected',
};

const STATUS_COLORS = {
  PENDING: { color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  REVIEWING: { color: 'var(--blue)', bg: 'var(--blue-bg)' },
  RESOLVED: { color: 'var(--accent)', bg: 'rgba(118,56,250,0.15)' },
  APPROVED: { color: 'var(--green)', bg: 'var(--green-bg)' },
  ESCALATED: { color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  REJECTED: { color: 'var(--red)', bg: 'var(--red-bg)' },
};

const StatusTracker = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api.get('/queries/mine')
      .then(res => setQueries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = queries.filter(q => {
    if (filter !== 'All' && q.status !== filter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      return q.title?.toLowerCase().includes(s) || q.description?.toLowerCase().includes(s);
    }
    return true;
  });

  const getStatusIdx = s => STATUS_FLOW.indexOf(s);
  const isRejected = s => s === 'REJECTED' || s === 'ESCALATED';

  const formatDate = d => d ? new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-title">📊 Status Tracker</div>
            <div className="page-subtitle">Track all your submitted queries through the workflow</div>
          </div>
          <Link to="/ask"><button className="btn btn-primary btn-sm">+ New Query</button></Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-bar-icon">🔍</span>
            <input type="text" placeholder="Search your queries..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar">
            {['All', ...STATUS_FLOW, 'ESCALATED', 'REJECTED'].map(s => (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {s === 'All' ? 'All' : STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No queries found</div>
            <div className="empty-desc">
              {search || filter !== 'All' ? 'Try different filters.' : 'You haven\'t submitted any queries yet.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {filtered.map(q => {
              const expanded = expandedId === q._id;
              const sc = STATUS_COLORS[q.status] || STATUS_COLORS.PENDING;
              const currentIdx = getStatusIdx(q.status);
              const rejected = isRejected(q.status);

              return (
                <div key={q._id} className="card" onClick={() => setExpandedId(expanded ? null : q._id)} style={{ cursor: 'pointer' }}>
                  <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
                      <span className="cat-pill">{q.category}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-strong)' }}>{q.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(q.createdAt)}</span>
                      <span style={{
                        background: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.color}40`,
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                      }}>{STATUS_LABELS[q.status] || q.status}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  {!rejected && (
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto' }}>
                      {STATUS_FLOW.map((step, idx) => {
                        const stepDone = currentIdx > idx;
                        const stepActive = currentIdx === idx;
                        const color = stepDone || stepActive ? STATUS_COLORS[step].color : 'var(--border)';
                        const bg = stepDone ? STATUS_COLORS[step].bg : stepActive ? STATUS_COLORS[step].bg : 'transparent';
                        return (
                          <React.Fragment key={step}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '70px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                border: `2px solid ${color}`,
                                background: stepActive || stepDone ? bg : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: 700, color,
                                transition: 'var(--transition)',
                              }}>
                                {stepDone ? '✓' : idx + 1}
                              </div>
                              <span style={{ fontSize: '10px', color: stepActive ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: stepActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                                {STATUS_LABELS[step]}
                              </span>
                            </div>
                            {idx < STATUS_FLOW.length - 1 && (
                              <div style={{ flex: 1, height: '2px', background: stepDone ? color : 'var(--border)', marginBottom: '18px', minWidth: '20px' }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Escalated / Rejected state */}
                  {rejected && (
                    <div style={{ padding: '12px 20px' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px',
                        background: q.status === 'REJECTED' ? 'var(--red-bg)' : 'var(--yellow-bg)',
                        border: `1px solid ${q.status === 'REJECTED' ? 'rgba(217,21,21,0.3)' : 'rgba(178,145,28,0.3)'}`,
                        borderRadius: 'var(--radius)',
                        color: q.status === 'REJECTED' ? 'var(--red)' : 'var(--yellow)',
                        fontSize: '12px',
                      }}>
                        {q.status === 'ESCALATED' ? '⚠ Escalated' : '❌ Rejected'}
                        {q.escalationReason && ` — ${q.escalationReason}`}
                      </div>
                    </div>
                  )}

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.7 }}>
                        {q.description}
                      </div>
                      {q.answer && (
                        <div style={{ padding: '12px', background: 'var(--green-bg)', border: '1px solid rgba(3,127,3,0.3)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--green)', marginBottom: '12px' }}>
                          <strong>✅ Final Answer: </strong>{q.answer}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', fontSize: '12px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Category: </span><strong>{q.category}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Priority: </span><strong style={{ color: q.priority === 'HIGH' ? 'var(--red)' : 'var(--text-strong)' }}>{q.priority}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Submitted: </span><strong>{formatDate(q.createdAt)}</strong></div>
                        {q.resolvedAt && <div><span style={{ color: 'var(--text-muted)' }}>Resolved: </span><strong>{formatDate(q.resolvedAt)}</strong></div>}
                        {q.viewCount > 0 && <div><span style={{ color: 'var(--text-muted)' }}>Views: </span><strong>{q.viewCount}</strong></div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusTracker;