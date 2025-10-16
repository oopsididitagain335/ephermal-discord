// lib/crypto.js
import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is missing in environment variables');
}

const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const AAD = Buffer.from('caught-wiki-v1');

function encryptOnce(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(AAD);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptOnce(ciphertext) {
  const [ivB64, tagB64, encB64] = ciphertext.split(':');
  if (!ivB64 || !tagB64 || !encB64) {
    throw new Error('Invalid encrypted format');
  }
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  decipher.setAAD(AAD);
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = decipher.update(Buffer.from(encB64, 'base64'));
  return Buffer.concat([decrypted, decipher.final()]).toString('utf8');
}

export function encryptTriple(plaintext) {
  let result = plaintext;
  for (let i = 0; i < 3; i++) {
    result = encryptOnce(result);
  }
  return result;
}

export function decryptTriple(ciphertext) {
  let result = ciphertext;
  for (let i = 0; i < 3; i++) {
    result = decryptOnce(result);
  }
  return result;
}
