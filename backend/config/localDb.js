/**
 * localDb.js — JSON file-based document store
 * Used as fallback when MongoDB is not available.
 * Mirrors a subset of the Mongoose API surface.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const DATA_DIR = path.join(__dirname, '..', 'local_data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let collections = {};

function collection(name) {
  const filePath = path.join(DATA_DIR, `${name}.json`);

  async function load() {
    if (!collections[name]) {
      try {
        const raw = await readFile(filePath, 'utf8');
        collections[name] = JSON.parse(raw);
      } catch {
        collections[name] = [];
      }
    }
  }

  async function save() {
    await writeFile(filePath, JSON.stringify(collections[name], null, 2), 'utf8');
  }

  return {
    name,

    async find(filter = {}) {
      await load();
      return collections[name].filter(doc => matchFilter(doc, filter));
    },

    async findOne(filter = {}) {
      await load();
      return collections[name].find(doc => matchFilter(doc, filter)) || null;
    },

    async findById(id) {
      await load();
      return collections[name].find(doc => doc._id === id) || null;
    },

    async create(data) {
      await load();
      const doc = {
        _id: ObjectId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      collections[name].push(doc);
      await save();
      return doc;
    },

    async findByIdAndUpdate(id, update) {
      await load();
      const idx = collections[name].findIndex(doc => doc._id === id);
      if (idx === -1) return null;
      collections[name][idx] = {
        ...collections[name][idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };
      await save();
      return collections[name][idx];
    },

    async findByIdAndDelete(id) {
      await load();
      const idx = collections[name].findIndex(doc => doc._id === id);
      if (idx === -1) return null;
      const [deleted] = collections[name].splice(idx, 1);
      await save();
      return deleted;
    },

    async deleteOne(filter) {
      await load();
      const idx = collections[name].findIndex(doc => matchFilter(doc, filter));
      if (idx === -1) return null;
      const [deleted] = collections[name].splice(idx, 1);
      await save();
      return deleted;
    },

    async findOneAndUpdate(filter, update) {
      await load();
      const idx = collections[name].findIndex(doc => matchFilter(doc, filter));
      if (idx === -1) return null;
      collections[name][idx] = {
        ...collections[name][idx],
        ...update,
        updatedAt: new Date().toISOString(),
      };
      await save();
      return collections[name][idx];
    },
  };
}

function matchFilter(doc, filter) {
  for (const [key, val] of Object.entries(filter)) {
    if (val === undefined) continue;
    if (typeof val === 'object' && val !== null) {
      // Handle $in, $regex, etc.
      if (val.$in) {
        if (!val.$in.includes(doc[key])) return false;
      } else if (val.$regex) {
        const flags = val.$options || '';
        if (!new RegExp(val.$regex, flags).test(doc[key])) return false;
      }
    } else {
      if (doc[key] !== val) return false;
    }
  }
  return true;
}

let _idCounter = Date.now();
function ObjectId() {
  _idCounter += 1;
  const ts = _idCounter.toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return ts + rand;
}

// Auto-save references so in-memory state persists across calls within the same process
function getOrCreateCollection(name) {
  if (!collections[name]) {
    collections[name] = null; // will be loaded lazily
  }
  return collection(name);
}

module.exports = { collection: getOrCreateCollection, ObjectId };