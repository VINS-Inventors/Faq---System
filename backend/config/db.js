/**
 * db.js — Unified data layer
 * Priority: PostgreSQL → MongoDB → Local JSON
 * All controllers import from here — zero changes needed elsewhere.
 */

require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');
const localDb  = require('./localDb');

let mode = null;          // 'pg' | 'mongo' | 'local'
const modelFns = {};

// ═══════════════════════════════════════════════════════════════════════════════
// POSTGRESQL
// ═══════════════════════════════════════════════════════════════════════════════

let pgPool = null;

const PG_TABLES = `
  CREATE TABLE IF NOT EXISTS users (
    _id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name      TEXT,
    email     TEXT UNIQUE,
    password  TEXT,
    role      TEXT DEFAULT 'user',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS queries (
    _id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId"          TEXT,
    title             TEXT,
    description       TEXT,
    category          TEXT DEFAULT 'General',
    status            TEXT DEFAULT 'PENDING',
    priority          TEXT DEFAULT 'MEDIUM',
    answer            TEXT,
    attachments       JSONB DEFAULT '[]',
    "linkedFAQs"      JSONB DEFAULT '[]',
    "assignedTo"      TEXT,
    "resolvedAt"      TEXT,
    "approvedBy"      TEXT,
    "escalationReason" TEXT,
    "viewCount"       INT DEFAULT 0,
    helpful           INT DEFAULT 0,
    "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"       TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS faqs (
    _id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    question        TEXT,
    answer          TEXT,
    category        TEXT DEFAULT 'General',
    tags            JSONB DEFAULT '[]',
    "createdBy"     TEXT,
    "updatedBy"     TEXT,
    "viewCount"     INT DEFAULT 0,
    helpful         INT DEFAULT 0,
    "notHelpful"    INT DEFAULT 0,
    "relatedQueries" JSONB DEFAULT '[]',
    "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS forums (
    _id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "queryId"   TEXT,
    "userId"    TEXT,
    message     TEXT,
    attachments JSONB DEFAULT '[]',
    likes       INT DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS posts (
    _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title        TEXT,
    body         TEXT,
    tags         JSONB DEFAULT '[]',
    "authorId"   TEXT,
    "authorName" TEXT,
    votes        INT DEFAULT 0,
    "votedBy"    JSONB DEFAULT '[]',
    views        INT DEFAULT 0,
    answers      JSONB DEFAULT '[]',
    "createdAt"  TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt"  TIMESTAMPTZ DEFAULT NOW()
  );
`;

async function connectPg() {
  try {
    pgPool = new Pool({
      connectionString: process.env.PG_URI || 'postgresql://postgres:postgres@localhost:5432/faq_system',
      connectionTimeoutMillis: 3000,
    });
    await pgPool.query('SELECT 1');
    await pgPool.query(PG_TABLES);
    return true;
  } catch (e) {
    pgPool = null;
    return false;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function rowToDoc(row) {
  if (!row) return null;
  const doc = { ...row };
  // parse JSONB fields that come back as objects already from pg driver
  // but ensure arrays are arrays
  ['tags','attachments','linkedFAQs','votedBy','answers','relatedQueries'].forEach(k => {
    if (doc[k] !== undefined && typeof doc[k] === 'string') {
      try { doc[k] = JSON.parse(doc[k]); } catch {}
    }
  });
  return doc;
}

function buildWhere(filter) {
  const keys = Object.keys(filter);
  if (!keys.length) return { text: '', values: [] };
  const clauses = [];
  const values  = [];
  keys.forEach(k => {
    const v = filter[k];
    if (v && typeof v === 'object' && v.$in) {
      values.push(v.$in);
      clauses.push(`"${k}" = ANY($${values.length})`);
    } else {
      values.push(v);
      clauses.push(`"${k}" = $${values.length}`);
    }
  });
  return { text: 'WHERE ' + clauses.join(' AND '), values };
}

function pgRepo(table) {
  return {
    async findOne(filter) {
      const { text, values } = buildWhere(filter);
      const r = await pgPool.query(`SELECT * FROM ${table} ${text} LIMIT 1`, values);
      return rowToDoc(r.rows[0] || null);
    },
    async findById(id) {
      const r = await pgPool.query(`SELECT * FROM ${table} WHERE _id=$1 LIMIT 1`, [id]);
      return rowToDoc(r.rows[0] || null);
    },
    async find(filter = {}, opts = {}) {
      const { text, values } = buildWhere(filter);
      let sql = `SELECT * FROM ${table} ${text}`;
      if (opts.sort) {
        const [col, dir] = Object.entries(opts.sort)[0];
        sql += ` ORDER BY "${col}" ${dir === -1 ? 'DESC' : 'ASC'}`;
      } else {
        sql += ` ORDER BY "createdAt" DESC`;
      }
      const r = await pgPool.query(sql, values);
      return r.rows.map(rowToDoc);
    },
    async create(data) {
      const now = new Date().toISOString();
      const doc = { ...data };
      // stringify arrays/objects for jsonb columns
      ['tags','attachments','linkedFAQs','votedBy','answers','relatedQueries'].forEach(k => {
        if (doc[k] !== undefined && typeof doc[k] !== 'string') doc[k] = JSON.stringify(doc[k]);
      });
      const cols   = Object.keys(doc);
      const vals   = Object.values(doc);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      const colNames = cols.map(c => `"${c}"`).join(', ');
      const r = await pgPool.query(
        `INSERT INTO ${table} (${colNames}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      return rowToDoc(r.rows[0]);
    },
    async findByIdAndUpdate(id, update) {
      const doc = { ...update, updatedAt: new Date().toISOString() };
      ['tags','attachments','linkedFAQs','votedBy','answers','relatedQueries'].forEach(k => {
        if (doc[k] !== undefined && typeof doc[k] !== 'string') doc[k] = JSON.stringify(doc[k]);
      });
      // handle $inc
      let extraSql = '';
      if (doc.$inc) {
        const incParts = Object.entries(doc.$inc).map(([k]) => `"${k}" = "${k}" + 1`);
        extraSql = incParts.join(', ');
        delete doc.$inc;
      }
      const entries = Object.entries(doc);
      if (!entries.length && !extraSql) return this.findById(id);
      const setClauses = entries.map(([k], i) => `"${k}" = $${i + 1}`);
      if (extraSql) setClauses.push(extraSql);
      const vals = entries.map(([, v]) => v);
      vals.push(id);
      const r = await pgPool.query(
        `UPDATE ${table} SET ${setClauses.join(', ')} WHERE _id=$${vals.length} RETURNING *`,
        vals
      );
      return rowToDoc(r.rows[0] || null);
    },
    async findByIdAndDelete(id) {
      const r = await pgPool.query(`DELETE FROM ${table} WHERE _id=$1 RETURNING *`, [id]);
      return rowToDoc(r.rows[0] || null);
    },
    async deleteOne(filter) {
      const { text, values } = buildWhere(filter);
      const r = await pgPool.query(`DELETE FROM ${table} ${text} RETURNING *`, values);
      return rowToDoc(r.rows[0] || null);
    },
  };
}

function buildPgModels() {
  modelFns.User  = pgRepo('users');
  modelFns.Query = pgRepo('queries');
  modelFns.FAQ   = pgRepo('faqs');
  modelFns.Forum = pgRepo('forums');
  modelFns.Post  = pgRepo('posts');
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONGODB (unchanged fallback)
// ═══════════════════════════════════════════════════════════════════════════════

const mongoSchemas = {
  User:  { name: String, email: String, password: String, role: String },
  Query: { userId: String, title: String, description: String, category: String, status: String,
           priority: String, answer: String, attachments: [String], linkedFAQs: [String],
           assignedTo: String, resolvedAt: String, approvedBy: String, escalationReason: String,
           viewCount: Number, helpful: Number, createdAt: String, updatedAt: String },
  FAQ:   { question: String, answer: String, category: String, tags: [String], createdBy: String,
           updatedBy: String, viewCount: Number, helpful: Number, notHelpful: Number,
           relatedQueries: [String], createdAt: String, updatedAt: String },
  Forum: { queryId: String, userId: String, message: String, attachments: [String],
           likes: Number, createdAt: String, updatedAt: String },
  Post:  { title: String, body: String, tags: [String], authorId: String, authorName: String,
           votes: Number, votedBy: [String], views: Number, answers: [Object],
           createdAt: String, updatedAt: String },
};

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/faq-system',
      { serverSelectionTimeoutMS: 3000 });
    return true;
  } catch { return false; }
}

function buildMongoModels() {
  for (const [name, schema] of Object.entries(mongoSchemas)) {
    const ms = new mongoose.Schema(schema, { timestamps: false });
    const Model = mongoose.model(name, ms);
    modelFns[name] = {
      findOne: f => Model.findOne(f).lean(),
      findById: id => Model.findById(id).lean(),
      find: (f = {}, opts = {}) => { let q = Model.find(f); if (opts.sort) q = q.sort(opts.sort); return q.lean(); },
      create: d => Model.create(d),
      findByIdAndUpdate: (id, u, opts = {}) => Model.findByIdAndUpdate(id, u, { new: true, ...opts }).lean(),
      findByIdAndDelete: id => Model.findByIdAndDelete(id).lean(),
      deleteOne: f => Model.deleteOne(f).lean(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCAL JSON (unchanged fallback)
// ═══════════════════════════════════════════════════════════════════════════════

function buildLocalModels() {
  const map = { User: 'users', Query: 'queries', FAQ: 'faqs', Forum: 'forums', Post: 'posts' };
  for (const [name, col] of Object.entries(map)) {
    const coll = localDb.collection(col);
    modelFns[name] = {
      findOne: f => coll.findOne(f),
      findById: id => coll.findById(id),
      find: async (f = {}, opts = {}) => {
        let docs = await coll.find(f);
        if (opts.sort) {
          const [k, d] = Object.entries(opts.sort)[0];
          docs = docs.sort((a, b) => {
            if (a[k] == null) return 1; if (b[k] == null) return -1;
            return d === -1 ? (a[k] > b[k] ? 1 : -1) : (a[k] < b[k] ? 1 : -1);
          });
        }
        return docs;
      },
      create: d => coll.create(d),
      findByIdAndUpdate: (id, u) => coll.findByIdAndUpdate(id, u),
      findByIdAndDelete: id => coll.findByIdAndDelete(id),
      deleteOne: f => coll.deleteOne(f),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════

let initialized = false;

async function init() {
  if (initialized) return;
  initialized = true;

  if (await connectPg()) {
    buildPgModels();
    mode = 'pg';
    console.log('🐘 Using PostgreSQL');
    return;
  }
  if (await connectMongo()) {
    buildMongoModels();
    mode = 'mongo';
    console.log('🍃 Using MongoDB');
    return;
  }
  buildLocalModels();
  mode = 'local';
  console.log('📦 Using local JSON storage');
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API  (identical to before — no controller changes needed)
// ═══════════════════════════════════════════════════════════════════════════════

const db = {
  init,
  getMode: () => mode,

  User_findOne:  f       => modelFns.User.findOne(f),
  User_findById: id      => modelFns.User.findById(id),
  User_create:   d       => modelFns.User.create(d),
  User_find:     (f={})  => modelFns.User.find(f),

  Query_find:            (f={}, o={}) => modelFns.Query.find(f, o),
  Query_findOne:         f            => modelFns.Query.findOne(f),
  Query_findById:        id           => modelFns.Query.findById(id),
  Query_create:          d            => modelFns.Query.create(d),
  Query_findByIdAndUpdate: (id,u,o)   => modelFns.Query.findByIdAndUpdate(id, u, o),
  Query_findByIdAndDelete: id         => modelFns.Query.findByIdAndDelete(id),
  Query_deleteOne:       f            => modelFns.Query.deleteOne(f),

  FAQ_find:            (f={}, o={}) => modelFns.FAQ.find(f, o),
  FAQ_findOne:         f            => modelFns.FAQ.findOne(f),
  FAQ_findById:        id           => modelFns.FAQ.findById(id),
  FAQ_create:          d            => modelFns.FAQ.create(d),
  FAQ_findByIdAndUpdate: (id,u,o)   => modelFns.FAQ.findByIdAndUpdate(id, u, o),
  FAQ_findByIdAndDelete: id         => modelFns.FAQ.findByIdAndDelete(id),

  Forum_find:    (f={}, o={}) => modelFns.Forum.find(f, o),
  Forum_create:  d            => modelFns.Forum.create(d),
  Forum_findOne: f            => modelFns.Forum.findOne(f),
  Forum_findById: id          => modelFns.Forum.findById(id),
  Forum_findByIdAndUpdate: (id,u) => modelFns.Forum.findByIdAndUpdate(id, u),
  Forum_findByIdAndDelete: id     => modelFns.Forum.findByIdAndDelete(id),

  Post_find:             (f={}, o={}) => modelFns.Post.find(f, o),
  Post_findById:         id           => modelFns.Post.findById(id),
  Post_create:           d            => modelFns.Post.create(d),
  Post_findByIdAndUpdate: (id,u,o)    => modelFns.Post.findByIdAndUpdate(id, u, o),
  Post_findByIdAndDelete: id          => modelFns.Post.findByIdAndDelete(id),
};

module.exports = db;
