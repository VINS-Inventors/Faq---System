import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const TABLES = [
  { key: 'users',   label: '👥 Users',   icon: '👥' },
  { key: 'queries', label: '❓ Queries',  icon: '❓' },
  { key: 'faqs',    label: '📖 FAQs',     icon: '📖' },
  { key: 'forums',  label: '💬 Forums',   icon: '💬' },
  { key: 'posts',   label: '📝 Posts',    icon: '📝' },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const JSONView = ({ data }) => {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const copy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: 'relative', marginTop: '8px' }}>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: '8px', right: '8px',
          padding: '4px 10px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', background: 'var(--bg-4)',
          color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', zIndex: 1,
        }}
      >
        {copied ? '✅ Copied' : '📋 Copy'}
      </button>
      <pre style={{
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px', fontSize: '11px',
        color: 'var(--accent-mid)', overflow: 'auto', maxHeight: '280px',
        lineHeight: 1.6, margin: 0,
      }}>{json}</pre>
    </div>
  );
};

const AdminDB = () => {
  const [table, setTable]     = useState('queries');
  const [rows, setRows]       = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Search / sort / pagination
  const [search, setSearch]   = useState('');
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Metadata
  const [total, setTotal]     = useState(0);
  const [filtered, setFiltered] = useState(0);
  const [pages, setPages]     = useState(1);

  // Row expand
  const [expandedId, setExpandedId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setExpandedId(null);
    try {
      const params = new URLSearchParams({
        sort: sortCol,
        dir: sortDir,
        page,
        limit: pageSize,
      });
      if (search.trim()) params.set('q', search.trim());
      const res = await api.get(`/db-view/${table}?${params}`);
      setRows(res.data.rows);
      setColumns(res.data.columns);
      setTotal(res.data.total);
      setFiltered(res.data.filtered);
      setPages(res.data.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [table, search, sortCol, sortDir, page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when table/search changes
  useEffect(() => { setPage(1); }, [table, search]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3, color: sortCol === col ? 'var(--accent)' : undefined }}>
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const thStyle = (col) => ({
    padding: '8px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: sortCol === col ? 'var(--accent)' : 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-2)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  });

  const tdStyle = {
    padding: '7px 14px',
    borderBottom: '1px solid var(--border)',
    fontSize: 12,
    color: 'var(--text)',
    verticalAlign: 'middle',
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const cellValue = (row, col) => {
    const v = row[col];
    if (v === null || v === undefined) return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>;
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'object') return <span style={{ color: 'var(--accent-mid)' }}>JSON</span>;
    return String(v);
  };

  const formatColType = (col) => {
    const t = col.data_type || '';
    const nullable = col.is_nullable === 'YES' ? '?' : '';
    if (t.includes('timestamp')) return `timestamptz${nullable}`;
    if (t.includes('json')) return `jsonb${nullable}`;
    if (t === 'text' || t === 'bpchar' || t === 'varchar') return `varchar${nullable}`;
    if (t === 'integer' || t === 'bigint' || t === 'smallint') return `int${nullable}`;
    return t.slice(0, 8) + nullable;
  };

  const isTextCol = col => ['text', 'varchar', 'bpchar', 'timestamp', 'timestamptz'].includes(col.data_type);

  // Pagination
  const PaginationControls = () => {
    if (pages <= 1) return null;
    const pages_to_show = [];
    const delta = 2;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        pages_to_show.push(i);
      } else if (pages_to_show[pages_to_show.length - 1] !== '...') {
        pages_to_show.push('...');
      }
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setPage(1)} disabled={page === 1}>«</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
        {pages_to_show.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ color: 'var(--text-muted)', padding: '0 4px', fontSize: 12 }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '4px 10px', borderRadius: 'var(--radius)',
                border: page === p ? 'none' : '1px solid var(--border)',
                background: page === p ? 'var(--accent)' : 'transparent',
                color: page === p ? 'white' : 'var(--text-muted)',
                fontSize: 12, cursor: 'pointer', fontWeight: page === p ? 700 : 400,
              }}
            >{p}</button>
          )
        )}
        <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>›</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setPage(pages)} disabled={page === pages}>»</button>
      </div>
    );
  };

  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="page-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-title">🗄️ DB Viewer</div>
            <div className="page-subtitle">PostgreSQL admin viewer — live data across all tables</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchData}
            style={{ gap: 6 }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Table selector tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {TABLES.map(t => (
            <button
              key={t.key}
              onClick={() => setTable(t.key)}
              style={{
                padding: '8px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: table === t.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: table === t.key ? 'var(--text-strong)' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: table === t.key ? 600 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'var(--transition)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
          {/* Search */}
          <div className="search-bar" style={{ maxWidth: 340 }}>
            <span className="search-bar-icon">🔍</span>
            <input
              placeholder="Search across all text columns…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Row count badge */}
          <div style={{
            padding: '5px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
          }}>
            {filtered === total
              ? <span><strong style={{ color: 'var(--text-strong)' }}>{total}</strong> rows</span>
              : <span><strong style={{ color: 'var(--accent)' }}>{filtered}</strong> of {total} rows</span>
            }
          </div>

          {/* Page size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              style={{
                padding: '5px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text)', fontSize: 12, cursor: 'pointer',
              }}
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="msg-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', minHeight: 0 }}>
          {loading ? (
            <div className="loading"><div className="spinner" /><span>Loading {table}…</span></div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No rows found</div>
              {search && <div className="empty-desc">Try adjusting your search query.</div>}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: columns.length * 120 }}>
              <thead>
                <tr>
                  {/* Expand toggle */}
                  <th style={{ ...thStyle(''), cursor: 'default', width: 40 }}></th>
                  {columns.map(col => (
                    <th
                      key={col.column_name}
                      style={thStyle(col.column_name)}
                      onClick={() => isTextCol(col) && handleSort(col.column_name)}
                      title={isTextCol(col) ? `Sort by ${col.column_name}` : col.column_name}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        <span>
                          {col.column_name}
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>
                            {formatColType(col)}
                          </span>
                        </span>
                        {isTextCol(col) && <SortIcon col={col.column_name} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isExpanded = expandedId === row._id;
                  return [
                    <tr
                      key={row._id || i}
                      onClick={() => setExpandedId(isExpanded ? null : row._id)}
                      style={{
                        background: isExpanded ? 'var(--bg-active)' : i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-2)',
                        cursor: 'pointer',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-2)')}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                        {isExpanded ? '▼' : '▶'}
                      </td>
                      {columns.map(col => (
                        <td key={col.column_name} style={tdStyle} title={String(row[col.column_name] ?? '')}>
                          {cellValue(row, col.column_name)}
                        </td>
                      ))}
                    </tr>,
                    isExpanded && (
                      <tr key={`${row._id || i}-expanded`}>
                        <td colSpan={columns.length + 1} style={{ padding: '12px 20px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Row Details — {row._id}
                          </div>
                          <JSONView data={row} />
                        </td>
                      </tr>
                    )
                  ];
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        {!loading && rows.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {page} of {pages} — showing {rows.length} rows
            </span>
            <PaginationControls />
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDB;