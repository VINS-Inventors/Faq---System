const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');

const TABLES = ['users', 'queries', 'faqs', 'forums', 'posts'];

// GET /api/db-view/tables — list all tables with row counts
router.get('/tables', auth, adminOnly, async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.PG_URI });
    const results = [];
    for (const table of TABLES) {
      try {
        const r = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
        results.push({ name: table, count: r.rows[0].count });
      } catch {
        results.push({ name: table, count: 0 });
      }
    }
    await pool.end();
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/db-view/:table — fetch table data with optional search/sort/pagination
router.get('/:table', auth, adminOnly, async (req, res) => {
  const { table } = req.params;
  if (!TABLES.includes(table)) return res.status(400).json({ message: `Unknown table: ${table}` });

  const db = require('../config/db');
  await db.init();
  if (db.getMode() !== 'pg') return res.status(501).json({ message: 'DB viewer only works with PostgreSQL' });

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.PG_URI });
  try {
    // Total count
    const countRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    const total = parseInt(countRes.rows[0].count, 10);

    // Search (filters all text/varchar columns)
    const { q, sort = 'createdAt', dir = 'desc', page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Get column names for search
    const colsRes = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      AND data_type IN ('text','varchar','bpchar','timestamp','timestamptz')
      ORDER BY ordinal_position`, [table]);
    const textCols = colsRes.rows.map(r => r.column_name);

    let query = `SELECT * FROM ${table}`;
    const values = [];
    if (q && textCols.length) {
      const clauses = textCols.map((c, i) => {
        values.push(`%${q}%`);
        return `CAST("${c}" AS TEXT) ILIKE $${i + 1}`;
      });
      query += ` WHERE ${clauses.join(' OR ')}`;
    }
    query += ` ORDER BY "${sort}" ${dir === 'asc' ? 'ASC' : 'DESC'}`;
    query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${offset}`;

    const dataRes = await pool.query(query, values);

    // Column metadata
    const metaRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`, [table]);

    // Filter count
    let filtered = total;
    if (q && textCols.length) {
      const fClauses = textCols.map((c, i) => {
        values.push(`%${q}%`);
        return `CAST("${c}" AS TEXT) ILIKE $${i + 1}`;
      });
      const fRes = await pool.query(`SELECT COUNT(*) FROM ${table} WHERE ${fClauses.join(' OR ')}`, values.slice(0, textCols.length));
      filtered = parseInt(fRes.rows[0].count, 10);
    }

    res.json({
      table,
      total,
      filtered,
      page: parseInt(page, 10),
      pages: Math.ceil(filtered / parseInt(limit, 10)),
      limit: parseInt(limit, 10),
      columns: metaRes.rows,
      rows: dataRes.rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    pool.end();
  }
});

module.exports = router;