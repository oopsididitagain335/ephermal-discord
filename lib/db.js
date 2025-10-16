// lib/db.js
import { MongoClient } from 'mongodb';
import { encryptTriple, decryptTriple } from './crypto.js';

const GLOBAL_URI = process.env.MONGODB_URI;

if (!GLOBAL_URI) {
  throw new Error('MONGODB_URI is missing in environment variables');
}

let globalClient;

async function getGlobalDb() {
  if (!globalClient) {
    globalClient = new MongoClient(GLOBAL_URI);
    await globalClient.connect();
  }
  const db = globalClient.db('caught_global');
  // Auto-delete rooms after 12 hours
  await db.collection('rooms').createIndex({ createdAt: 1 }, { expireAfterSeconds: 12 * 3600 });
  return db;
}

const USER_SETTINGS_WHITELIST = [
  'theme',
  'serverRetentionRules',
  'language',
  'compactMode'
];

export async function saveUserSettings(userId, rawSettings, userMongoUri = null) {
  const safeSettings = {};
  for (const key of Object.keys(rawSettings)) {
    if (USER_SETTINGS_WHITELIST.includes(key)) {
      safeSettings[key] = rawSettings[key];
    }
  }

  const encryptedSettings = {};
  for (const [key, value] of Object.entries(safeSettings)) {
    encryptedSettings[key] = encryptTriple(JSON.stringify(value));
  }

  if (userMongoUri) {
    const client = new MongoClient(userMongoUri);
    try {
      await client.connect();
      const db = client.db('caught_custom');
      await db.collection('user_settings').updateOne(
        { userId },
        { $set: { ...encryptedSettings, updatedAt: new Date() } },
        { upsert: true }
      );
    } finally {
      await client.close();
    }
  } else {
    const db = await getGlobalDb();
    await db.collection('user_settings').updateOne(
      { userId },
      { $set: { ...encryptedSettings, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

export async function loadUserSettings(userId, userMongoUri = null) {
  let doc = null;
  if (userMongoUri) {
    const client = new MongoClient(userMongoUri);
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

  const decrypted = {};
  for (const [key, value] of Object.entries(doc)) {
    if (['_id', 'userId', 'updatedAt'].includes(key)) continue;
    try {
      decrypted[key] = JSON.parse(decryptTriple(value));
    } catch (e) {
      console.warn(`Failed to decrypt setting: ${key}`);
    }
  }
  return decrypted;
}

export { getGlobalDb };
