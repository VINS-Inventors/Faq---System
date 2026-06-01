/**
 * migrate.js — One-shot migration from local JSON → PostgreSQL
 * Run: node migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.PG_URI });
const DATA = path.join(__dirname, '..', 'local_data');

function load(file) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8')); }
  catch { return []; }
}

async function upsert(table, rows, jsonbCols = []) {
  if (!rows.length) { console.log(`  ⚠  ${table}: no data`); return; }
  let inserted = 0, skipped = 0;
  for (const row of rows) {
    const doc = { ...row };
    jsonbCols.forEach(k => {
      if (doc[k] !== undefined && typeof doc[k] !== 'string')
        doc[k] = JSON.stringify(doc[k]);
    });
    const cols = Object.keys(doc);
    const vals = Object.values(doc);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
    const colNames = cols.map(c => `"${c}"`).join(', ');
    try {
      await pool.query(
        `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) ON CONFLICT (_id) DO NOTHING`,
        vals
      );
      inserted++;
    } catch (e) {
      console.log(`  ✗ ${table} row ${doc._id}: ${e.message}`);
      skipped++;
    }
  }
  console.log(`  ✓ ${table}: ${inserted} inserted, ${skipped} skipped`);
}

async function migrate() {
  console.log('\n🚀 Starting migration: local JSON → PostgreSQL\n');

  const users   = load('users.json');
  const queries = load('queries.json');
  const faqs    = load('faqs.json');
  const posts   = load('posts.json');

  // Normalize queries — local data has mixed field names
  const normQueries = queries.map(q => ({
    _id:              q._id,
    userId:           q.userId,
    title:            q.title || q.question || '',
    description:      q.description || q.question || '',
    category:         q.category || 'General',
    status:           q.status || 'PENDING',
    priority:         q.priority || 'MEDIUM',
    answer:           q.answer || null,
    attachments:      JSON.stringify(q.attachments || []),
    linkedFAQs:       JSON.stringify(q.linkedFAQs || []),
    assignedTo:       q.assignedTo || null,
    resolvedAt:       q.resolvedAt || null,
    approvedBy:       q.approvedBy || null,
    escalationReason: q.escalationReason || null,
    viewCount:        q.viewCount || 0,
    helpful:          q.helpful || 0,
    createdAt:        q.createdAt || new Date().toISOString(),
    updatedAt:        q.updatedAt || new Date().toISOString(),
  }));

  const normFaqs = faqs.map(f => ({
    _id:            f._id,
    question:       f.question,
    answer:         f.answer,
    category:       f.category || 'General',
    tags:           JSON.stringify(f.tags || []),
    createdBy:      f.createdBy || null,
    updatedBy:      f.updatedBy || null,
    viewCount:      f.viewCount || 0,
    helpful:        f.helpful || 0,
    notHelpful:     f.notHelpful || 0,
    relatedQueries: JSON.stringify(f.relatedQueries || []),
    createdAt:      f.createdAt || new Date().toISOString(),
    updatedAt:      f.updatedAt || new Date().toISOString(),
  }));

  const normPosts = posts.map(p => ({
    _id:        p._id,
    title:      p.title,
    body:       p.body,
    tags:       JSON.stringify(p.tags || []),
    authorId:   p.authorId,
    authorName: p.authorName || '',
    votes:      p.votes || 0,
    votedBy:    JSON.stringify(p.votedBy || []),
    views:      p.views || 0,
    answers:    JSON.stringify(p.answers || []),
    createdAt:  p.createdAt || new Date().toISOString(),
    updatedAt:  p.updatedAt || new Date().toISOString(),
  }));

  await upsert('users',   users,        []);
  await upsert('queries', normQueries,  []);
  await upsert('faqs',    normFaqs,     []);
  await upsert('posts',   normPosts,    []);

  // Verify counts
  console.log('\n📊 Row counts in PostgreSQL:');
  for (const t of ['users', 'queries', 'faqs', 'posts', 'forums']) {
    const r = await pool.query(`SELECT COUNT(*) FROM ${t}`);
    console.log(`  ${t.padEnd(10)} ${r.rows[0].count} rows`);
  }

  console.log('\n✅ Migration complete!\n');
  await pool.end();
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
