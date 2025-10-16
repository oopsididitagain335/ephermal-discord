// lib/db.js
import { MongoClient } from 'mongodb';
import { encryptTriple, decryptTriple } from './crypto.js';

const GLOBAL_URI = process.env.MONGODB_URI;
let globalClient;

async function getGlobalDb() {
  if (!globalClient) {
    globalClient = new MongoClient(GLOBAL_URI);
    await globalClient.connect();
  }
  const db = globalClient.db('caught_global');
  // Auto-delete rooms after 12 hours (for DMs and global servers)
  await db.collection('rooms').createIndex({ createdAt: 1 }, { expireAfterSeconds: 12 * 3600 });
  return db;
}

// Whitelist of safe, non-sensitive user settings
const USER_SETTINGS_WHITELIST = [
  'theme',
  'serverRetentionRules',
  'language',
  'compactMode',
  'notificationSound'
];

/**
 * Save user settings to either:
 * - User's own MongoDB (if URI provided)
 * - Global DB (fallback)
 */
export async function saveUserSettings(userId, rawSettings, userMongoUri = null) {
  // 1. Filter out unsafe fields
  const safeSettings = {};
  for (const key of Object.keys(rawSettings)) {
    if (USER_SETTINGS_WHITELIST.includes(key)) {
      safeSettings[key] = rawSettings[key];
    }
  }

  // 2. Encrypt all values
  const encryptedSettings = {};
  for (const [key, value] of Object.entries(safeSettings)) {
    encryptedSettings[key] = encryptTriple(JSON.stringify(value));
  }

  // 3. Save to user DB if provided
  if (userMongoUri) {
    const client = new MongoClient(userMongoUri);
    try {
      await client.connect();
      const db = client.db('caught_custom');
      // Apply TTL if temporary retention is set
      const settings = await db.collection('user_settings').findOne({ userId });
      await db.collection('user_settings').updateOne(
        { userId },
        { $set: { ...encryptedSettings, updatedAt: new Date() } },
        { upsert: true }
      );
    } finally {
      await client.close();
    }
  } else {
    // Save to global DB
    const db = await getGlobalDb();
    await db.collection('user_settings').updateOne(
      { userId },
      { $set: { ...encryptedSettings, updatedAt: new Date() } },
      { upsert: true }
    );
  }
}

/**
 * Load user settings from:
 * - User's MongoDB (if URI provided and exists)
 * - Global DB (fallback)
 */
export async function loadUserSettings(userId, userMongoUri = null) {
  let doc = null;

  // Try user's own DB first
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

  // Fallback to global DB
  if (!doc) {
    const db = await getGlobalDb();
    doc = await db.collection('user_settings').findOne({ userId });
  }

  if (!doc) return {};

  // Decrypt settings
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

// Re-export for direct use in auth routes
export { getGlobalDb };
