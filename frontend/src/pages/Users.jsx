import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [notif, setNotif] = useState({ type: '', msg: '' });

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showNotif = (type, msg) => {
    setNotif({ type, msg });
    setTimeout(() => setNotif({ type: '', msg: '' }), 3500);
  };

  const handleDelete = async (user) => {
    if (user._id === currentUser?._id) {
      showNotif('error', "You can't delete your own account.");
      return;
    }
    if (!confirm(`Delete user "${user.name}" (${user.email})? This cannot be undone.`)) return;
    setDeletingId(user._id);
    try {
      await api.delete(`/users/${user._id}`);
      setUsers(prev => prev.filter(u => u._id !== user._id));
      showNotif('success', `User "${user.name}" deleted successfully.`);
    } catch (err) {
      showNotif('error', err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = users
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => {
      const q = search.toLowerCase();
      return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle = (col) => ({
    padding: 'var(--s8) var(--s16)',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-2)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  });

  const tdStyle = {
    padding: 'var(--s12) var(--s16)',
    borderBottom: '1px solid var(--border)',
    fontSize: 13,
    color: 'var(--text)',
    verticalAlign: 'middle',
  };

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-title">👥 Users</div>
            <div className="page-subtitle">{filtered.length} of {users.length} users</div>
          </div>
        </div>

        {notif.msg && (
          <div className={notif.type === 'error' ? 'msg-error' : 'msg-success'}>{notif.msg}</div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 'var(--s8)', flexShrink: 0, flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-bar-icon">🔍</span>
            <input placeholder="Search by name or email…" value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-bar">
            {['all', 'user', 'admin'].map(r => (
              <button key={r} className={`filter-btn${roleFilter === r ? ' active' : ''}`}
                onClick={() => setRoleFilter(r)}>
                {r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          {loading ? (
            <div className="loading"><div className="spinner" /><span>Loading…</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No users found</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle('name')} onClick={() => toggleSort('name')}>
                    Name <SortIcon col="name" />
                  </th>
                  <th style={thStyle('email')} onClick={() => toggleSort('email')}>
                    Email <SortIcon col="email" />
                  </th>
                  <th style={thStyle('role')} onClick={() => toggleSort('role')}>
                    Role <SortIcon col="role" />
                  </th>
                  <th style={thStyle('createdAt')} onClick={() => toggleSort('createdAt')}>
                    Joined <SortIcon col="createdAt" />
                  </th>
                  <th style={{ ...thStyle('actions'), cursor: 'default', width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id}
                    style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-2)', transition: 'background 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-2)'}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--accent), var(--accent-mid))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#fff',
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={tdStyle}>
                      <span className={`user-role ${u.role}`}>{u.role}</span>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 12 }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      }) : '—'}
                    </td>
                    <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u._id || u._id === currentUser?._id}
                        title={u._id === currentUser?._id ? "Can't delete yourself" : 'Delete user'}
                        style={{ minWidth: 36 }}
                      >
                        {deletingId === u._id ? '…' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default Users;