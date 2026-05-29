/**
 * db.js — Unified model registry
 * Tries MongoDB first. Falls back to local JSON store if unavailable.
 * All code imports models from here, NOT directly from mongoose.
 */

const mongoose = require('mongoose');
const localDb = require('./localDb');

let mongoAvailable = false;
const modelFns = {};

// ── Schema definitions (shared by both backends) ─────────────────────────────

const userSchema = {
  name: String,
  email: String,
  password: String,
  role: String,
};

const querySchema = {
  userId: String,
  title: String,
  description: String,
  category: String,
  status: String,
  priority: String,
  answer: String,
  attachments: [String],
  linkedFAQs: [String],
  assignedTo: String,
  resolvedAt: String,
  approvedBy: String,
  escalationReason: String,
  viewCount: Number,
  helpful: Number,
  createdAt: String,
  updatedAt: String,
};

const faqSchema = {
  question: String,
  answer: String,
  category: String,
  tags: [String],
  createdBy: String,
  updatedBy: String,
  viewCount: Number,
  helpful: Number,
  notHelpful: Number,
  relatedQueries: [String],
  createdAt: String,
  updatedAt: String,
};

const forumSchema = {
  queryId: String,
  userId: String,
  message: String,
  attachments: [String],
  likes: Number,
  createdAt: String,
  updatedAt: String,
};

// ── Mongoose model factory ────────────────────────────────────────────────────

function makeMongooseModel(name, schema) {
  const mongoSchema = new mongoose.Schema(schema, { timestamps: false });
  mongoSchema.virtual('createdAt').get(function () {
    return this._id ? this._id.getTimestamp().toISOString() : new Date().toISOString();
  });
  return mongoose.model(name, mongoSchema);
}

// ── Connect to MongoDB ────────────────────────────────────────────────────────

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/faq-system', {
      serverSelectionTimeoutMS: 3000,
    });
    mongoose.connection.on('error', () => { mongoAvailable = false; });
    return true;
  } catch {
    return false;
  }
}

// ── Build MongoDB modelFns ────────────────────────────────────────────────────

function buildMongoModels() {
  const User = makeMongooseModel('User', userSchema);
  const Query = makeMongooseModel('Query', querySchema);
  const FAQ = makeMongooseModel('FAQ', faqSchema);
  const Forum = makeMongooseModel('Forum', forumSchema);

  const makeRepo = (Model) => ({
    findOne: (filter) => Model.findOne(filter).lean(),
    findById: (id) => Model.findById(id).lean(),
    create: (data) => Model.create(data),
    find: (filter = {}, opts = {}) => {
      let q = Model.find(filter);
      if (opts.sort) q = q.sort(opts.sort);
      return q.lean();
    },
    findByIdAndUpdate: (id, update, opts = {}) => Model.findByIdAndUpdate(id, update, { new: true, ...opts }).lean(),
    findByIdAndDelete: (id) => Model.findByIdAndDelete(id).lean(),
    deleteOne: (filter) => Model.deleteOne(filter).lean(),
  });

  modelFns.User = makeRepo(User);
  modelFns.Query = makeRepo(Query);
  modelFns.FAQ = makeRepo(FAQ);
  modelFns.Forum = makeRepo(Forum);
}

// ── Build local-json modelFns ─────────────────────────────────────────────────

function buildLocalModels() {
  const Users = localDb.collection('users');
  const Queries = localDb.collection('queries');
  const FAQs = localDb.collection('faqs');
  const Forums = localDb.collection('forums');

  const makeRepo = (coll) => ({
    findOne: (filter) => coll.findOne(filter),
    findById: (id) => coll.findById(id),
    create: (data) => coll.create(data),
    find: async (filter = {}, opts = {}) => {
      let docs = await coll.find(filter);
      if (opts.sort) {
        const sortKey = Object.keys(opts.sort)[0];
        const sortDir = opts.sort[sortKey];
        docs = docs.sort((a, b) => {
          const aVal = a[sortKey], bVal = b[sortKey];
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          return sortDir === -1
            ? aVal > bVal ? 1 : aVal < bVal ? -1 : 0
            : aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        });
      }
      return docs;
    },
    findByIdAndUpdate: (id, update) => coll.findByIdAndUpdate(id, update),
    findByIdAndDelete: (id) => coll.findByIdAndDelete(id),
    deleteOne: (filter) => coll.deleteOne(filter),
  });

  modelFns.User = makeRepo(Users);
  modelFns.Query = makeRepo(Queries);
  modelFns.FAQ = makeRepo(FAQs);
  modelFns.Forum = makeRepo(Forums);
}

// ── Init ──────────────────────────────────────────────────────────────────────

let initialized = false;

async function init() {
  if (initialized) return;
  mongoAvailable = await connectMongo();

  if (mongoAvailable) {
    buildMongoModels();
    console.log('📦 Using MongoDB');
  } else {
    buildLocalModels();
    console.log('📦 Using local JSON storage');
  }

  initialized = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

const db = {
  init,

  // User
  User_findOne: (filter) => { init(); return modelFns.User.findOne(filter); },
  User_findById: (id) => { init(); return modelFns.User.findById(id); },
  User_create: (data) => { init(); return modelFns.User.create(data); },
  User_find: (filter = {}) => { init(); return modelFns.User.find(filter); },

  // Query
  Query_find: (filter = {}, opts = {}) => { init(); return modelFns.Query.find(filter, opts); },
  Query_findOne: (filter) => { init(); return modelFns.Query.findOne(filter); },
  Query_findById: (id) => { init(); return modelFns.Query.findById(id); },
  Query_create: (data) => { init(); return modelFns.Query.create(data); },
  Query_findByIdAndUpdate: (id, update, opts) => { init(); return modelFns.Query.findByIdAndUpdate(id, update, opts); },
  Query_findByIdAndDelete: (id) => { init(); return modelFns.Query.findByIdAndDelete(id); },
  Query_deleteOne: (filter) => { init(); return modelFns.Query.deleteOne(filter); },

  // FAQ
  FAQ_find: (filter = {}, opts = {}) => { init(); return modelFns.FAQ.find(filter, opts); },
  FAQ_findOne: (filter) => { init(); return modelFns.FAQ.findOne(filter); },
  FAQ_findById: (id) => { init(); return modelFns.FAQ.findById(id); },
  FAQ_create: (data) => { init(); return modelFns.FAQ.create(data); },
  FAQ_findByIdAndUpdate: (id, update, opts) => { init(); return modelFns.FAQ.findByIdAndUpdate(id, update, opts); },
  FAQ_findByIdAndDelete: (id) => { init(); return modelFns.FAQ.findByIdAndDelete(id); },

  // Forum
  Forum_find: (filter = {}, opts = {}) => { init(); return modelFns.Forum.find(filter, opts); },
  Forum_create: (data) => { init(); return modelFns.Forum.create(data); },
  Forum_findOne: (filter) => { init(); return modelFns.Forum.findOne(filter); },
};

module.exports = db;