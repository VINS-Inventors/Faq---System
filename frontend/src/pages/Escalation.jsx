import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const Escalation = () => {
  const [escalated, setEscalated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [assignForm, setAssignForm] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [notif, setNotif] = useState({ type: '', msg: '' });

  const fetchEscalated = () => {
    setLoading(true);
    api.get('/queries/admin/escalated').then(res => setEscalated(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEscalated(); }, []);

  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif({ type: '', msg: '' }), 3500);
  };

  const handleReassign = async id => {
    const target = assignForm[id];
    if (!target?.trim()) { alert('Select or enter a moderator to assign to'); return; }
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/reassign`, { assignedTo: target.trim() });
      showNotif('success', 'Query re-assigned successfully');
      setAssignForm(prev => ({ ...prev, [id]: '' }));
      fetchEscalated();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to reassign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async id => {
    if (!confirm('Reject this escalated query?')) return;
    setActionLoading(true);
    try {
      await api.put(`/queries/${id}/reject`, { reason: 'Escalated query resolved and rejected' });
      showNotif('success', 'Query rejected');
      fetchEscalated();
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = d => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="page-title">⚠ Escalation Center</div>
            <div className="page-subtitle">Review queries escalated by moderators — re-assign or close them</div>
          </div>
          <span style={{
            background: 'var(--yellow-bg)',
            color: 'var(--yellow)',
            border: '1px solid rgba(178,145,28,0.3)',
            borderRadius: '12px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            {escalated.length} escalated
          </span>
        </div>

        {notif.msg && <div className={notif.type === 'error' ? 'msg-error' : 'msg-success'}>{notif.msg}</div>}

        {loading ? (
          <div className="loading"><div className="spinner" /><span>Loading...</span></div>
        ) : escalated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">No escalated queries</div>
            <div className="empty-desc">All escalated queries have been handled.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {escalated.map(q => (
              <div key={q._id} className="review-item">
                <div className="review-item-header" onClick={() => setExpandedId(expandedId === q._id ? null : q._id)} style={{ cursor: 'pointer' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="cat-pill">{q.category}</span>
                      <span style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', border: '1px solid rgba(178,145,28,0.3)', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>ESCALATED</span>
                    </div>
                    <div className="review-item-question">{q.title}</div>
                    <div className="review-item-from">From <strong>{q.userId?.name}</strong> ({q.userId?.email}) · {formatDate(q.createdAt)}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expandedId === q._id ? '▲' : '▼'}</span>
                </div>

                {expandedId === q._id && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.7, padding: '12px', background: 'var(--bg-3)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--yellow)' }}>
                      {q.description}
                    </div>
                    {q.escalationReason && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--yellow-bg)', border: '1px solid rgba(178,145,28,0.3)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--yellow)' }}>
                        <strong>⚠ Escalation Reason: </strong>{q.escalationReason}
                      </div>
                    )}
                    {q.answer && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'var(--green-bg)', border: '1px solid rgba(3,127,3,0.3)', borderRadius: 'var(--radius)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600, marginBottom: '6px' }}>MODERATOR ANSWER</div>
                        <div style={{ fontSize: '13px', color: 'var(--text)' }}>{q.answer}</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="review-item-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Moderator name to re-assign to..."
                      value={assignForm[q._id] || ''}
                      onChange={e => setAssignForm(prev => ({ ...prev, [q._id]: e.target.value }))}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, minWidth: '200px' }}
                    />
                    <button className="btn btn-success btn-sm" onClick={e => { e.stopPropagation(); handleReassign(q._id); }} disabled={actionLoading}>↩ Re-assign</button>
                    <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleReject(q._id); }} disabled={actionLoading}>❌ Close</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Escalation;