// lib/db.js
import { MongoClient } from 'mongodb';
import { encryptTriple, decryptTriple } from './crypto';

const GLOBAL_URI = process.env.MONGODB_URI;
let globalClient;

async function getGlobalDb() {
  if (!globalClient) {
    globalClient = new MongoClient(GLOBAL_URI);
    await globalClient.connect();
  }
  const db = globalClient.db('caught_global');
  await db.collection('rooms').createIndex({ createdAt: 1 }, { expireAfterSeconds: 12 * 3600 });
  return db;
}

const WHITELIST = ['theme', 'serverRetentionRules', 'language', 'compactMode'];

export async function saveUserSettings(userId, raw, userUri = null) {
  const safe = {};
  for (const k of Object.keys(raw)) {
    if (WHITELIST.includes(k)) safe[k] = raw[k];
  }

  const enc = {};
  for (const [k, v] of Object.entries(safe)) {
    enc[k] = encryptTriple(JSON.stringify(v));
  }

  if (userUri) {
    const client = new MongoClient(userUri);
    try {
      await client.connect();
      const db = client.db('caught_custom');
      await db.collection('user_settings').updateOne({ userId }, { $set: { ...enc, updatedAt: new Date() } }, { upsert: true });
    } finally {
      await client.close();
    }
  } else {
    const db = await getGlobalDb();
    await db.collection('user_settings').updateOne({ userId }, { $set: { ...enc, updatedAt: new Date() } }, { upsert: true });
  }
}

export async function loadUserSettings(userId, userUri = null) {
  let doc = null;
  if (userUri) {
    const client = new MongoClient(userUri);
    try {
      await client.connect();
      const db = client.db('caught_custom');
      doc = await db.collection('user_settings').findOne({ userId });
    } finally {
      await client.close();
    }
  }

  if (!doc) {
    const db = await getGlobalDb();
    doc = await db.collection('user_settings').findOne({ userId });
  }

  if (!doc) return {};
  const out = {};
  for (const [k, v] of Object.entries(doc)) {
    if (['_id', 'userId', 'updatedAt'].includes(k)) continue;
    try {
      out[k] = JSON.parse(decryptTriple(v));
    } catch {}
  }
  return out;
}

export { getGlobalDb };
