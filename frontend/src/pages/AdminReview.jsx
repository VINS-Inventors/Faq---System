import React, { useState, useEffect } from 'react';
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

const AdminReview = () => {
  const [pending, setPending] = useState([]);
  const [reviewing, setReviewing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [resolveForm, setResolveForm] = useState({});
  const [escalateForm, setEscalateForm] = useState({});
  const [rejectForm, setRejectForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [notif, setNotif] = useState({ type: '', msg: '' });

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/queries/admin/pending'),
      api.get('/queries/admin/reviewing'),
    ]).then(([pendRes, revRes]) => {
      setPending(pendRes.data);
      setReviewing(revRes.data);
    }).catch(() => showNotif('error', 'Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif({ type: '', msg: '' }), 3500);
  };

  const handleClaim = async id => {
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/claim`);
      showNotif('success', 'Query claimed — now in review');
      fetchAll();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to claim');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async id => {
    const ans = resolveForm[id];
    if (!ans?.trim()) { alert('Write an answer before resolving'); return; }
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/resolve`, { answer: ans.trim() });
      showNotif('success', 'Query resolved! Pending final admin approval.');
      setResolveForm(prev => ({ ...prev, [id]: '' }));
      fetchAll();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to resolve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async id => {
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/approve`);
      showNotif('success', '✅ Query approved and published as FAQ!');
      fetchAll();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async id => {
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/escalate`, { reason: escalateForm[id] || undefined });
      showNotif('success', '⚠ Query escalated');
      setEscalateForm(prev => ({ ...prev, [id]: '' }));
      fetchAll();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to escalate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async id => {
    if (!confirm('Reject this query?')) return;
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/reject`, { reason: rejectForm[id] || undefined });
      showNotif('success', '❌ Query rejected');
      setRejectForm(prev => ({ ...prev, [id]: '' }));
      fetchAll();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = d => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const priorityColor = p => p === 'HIGH' ? 'var(--red)' : p === 'LOW' ? 'var(--text-muted)' : 'var(--yellow)';
  const priorityBg = p => p === 'HIGH' ? 'var(--red-bg)' : p === 'LOW' ? 'transparent' : 'var(--yellow-bg)';

  const statusClass = s => {
    const m = { PENDING: 'status-pending', REVIEWING: 'status-pending', RESOLVED: 'status-answered', APPROVED: 'status-answered', ESCALATED: 'status-pending', REJECTED: 'status-rejected' };
    return m[s] || 'status-pending';
  };

  const renderQueryCard = (q, source) => {
    const isExpanded = expandedId === q._id;

    return (
      <div key={q._id} className="review-item">
        <div className="review-item-header" onClick={() => setExpandedId(isExpanded ? null : q._id)} style={{ cursor: 'pointer' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="cat-pill">{q.category}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: priorityColor(q.priority), background: priorityBg(q.priority), padding: '2px 8px', borderRadius: '10px' }}>{q.priority}</span>
              <span className={`status-badge ${statusClass(q.status)}`}>{STATUS_LABELS[q.status] || q.status}</span>
            </div>
            <div className="review-item-question" style={{ marginBottom: '8px' }}>{q.title}</div>
            <div className="review-item-from">
              From <strong>{q.userId?.name}</strong> ({q.userId?.email}) · {formatDate(q.createdAt)}
            </div>
            {q.assignedTo && (
              <div style={{ fontSize: '11px', color: 'var(--accent-mid)', marginTop: '4px' }}>
                Assigned to: {q.assignedTo.name || q.assignedTo}
              </div>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>{isExpanded ? '▲' : '▼'}</span>
        </div>

        {/* Expanded description */}
        {isExpanded && (
          <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
              {q.description}
            </div>

            {/* Resolved answer preview */}
            {q.answer && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--green-bg)', border: '1px solid rgba(3,127,3,0.3)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, marginBottom: '6px' }}>RESOLVED ANSWER</div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>{q.answer}</div>
              </div>
            )}

            {/* Escalation reason */}
            {q.escalationReason && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--yellow-bg)', border: '1px solid rgba(178,145,28,0.3)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--yellow)' }}>
                ⚠ Escalation reason: {q.escalationReason}
              </div>
            )}
          </div>
        )}

        {/* Action footer */}
        <div className="review-item-footer" onClick={e => e.stopPropagation()}>
          {source === 'pending' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => handleClaim(q._id)} disabled={actionLoading}>✍️ Claim & Review</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleReject(q._id)} disabled={actionLoading}>❌ Reject</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(expandedId === q._id ? null : q._id)}>
                {expandedId === q._id ? 'Hide' : 'Details'}
              </button>
            </>
          )}
          {source === 'reviewing' && (
            <>
              {!q.answer ? (
                <>
                  <textarea
                    className="form-textarea"
                    placeholder="Write the answer to resolve this query..."
                    value={resolveForm[q._id] || ''}
                    onChange={e => setResolveForm(prev => ({ ...prev, [q._id]: e.target.value }))}
                    rows={4}
                    style={{ marginBottom: '8px', minHeight: '90px' }}
                  />
                  <div className="btn-row">
                    <button className="btn btn-success btn-sm" onClick={() => handleResolve(q._id)} disabled={actionLoading || !resolveForm[q._id]?.trim()}>✅ Resolve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => { setRejectForm(prev => ({ ...prev, [q._id]: 'Rejected by moderator' })); handleReject(q._id); }} disabled={actionLoading}>❌ Reject</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEscalateForm(prev => ({ ...prev, [q._id]: '' })); }}>⚠ Escalate</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Answer provided — awaiting final admin approval</div>
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(q._id)} disabled={actionLoading}>✅ Approve & Publish</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { if(confirm('Reject this query?')) handleReject(q._id); }}>❌ Reject</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEscalateForm(prev => ({ ...prev, [q._id]: '' }))}>⚠ Escalate</button>
                </>
              )}
            </>
          )}
        </div>

        {/* Escalate form */}
        {expandedId === q._id && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--yellow)' }}>⚠ Escalation Reason (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Why is this being escalated?"
                value={escalateForm[q._id] || ''}
                onChange={e => setEscalateForm(prev => ({ ...prev, [q._id]: e.target.value }))}
              />
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }} onClick={() => handleEscalate(q._id)} disabled={actionLoading}>Submit Escalation</button>
          </div>
        )}

        {/* Reject form */}
        {expandedId === q._id && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-3)' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--red)' }}>❌ Rejection Reason (optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Why is this being rejected?"
                value={rejectForm[q._id] || ''}
                onChange={e => setRejectForm(prev => ({ ...prev, [q._id]: e.target.value }))}
              />
            </div>
            <button className="btn btn-danger btn-sm" style={{ marginTop: '8px' }} onClick={() => handleReject(q._id)} disabled={actionLoading}>Confirm Rejection</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-title">🛡️ Admin Review</div>
            <div className="page-subtitle">Manage the full query lifecycle: PENDING → REVIEWING → RESOLVED → APPROVED</div>
          </div>
        </div>

        {notif.msg && <div className={notif.type === 'error' ? 'msg-error' : 'msg-success'}>{notif.msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {[
            { key: 'pending', label: 'Pending', count: pending.length },
            { key: 'reviewing', label: 'Reviewing', count: reviewing.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--text-strong)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'var(--transition)',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: tab.key === 'pending' ? 'var(--yellow-bg)' : 'var(--accent)',
                  color: tab.key === 'pending' ? 'var(--yellow)' : 'white',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', marginTop: '16px' }}>
            {activeTab === 'pending' && (
              pending.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <div className="empty-title">No pending queries</div>
                  <div className="empty-desc">All caught up! New queries will appear here.</div>
                </div>
              ) : (
                pending.map(q => renderQueryCard(q, 'pending'))
              )
            )}
            {activeTab === 'reviewing' && (
              reviewing.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No queries in review</div>
                  <div className="empty-desc">Claim a pending query to start reviewing it.</div>
                </div>
              ) : (
                reviewing.map(q => renderQueryCard(q, 'reviewing'))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReview;