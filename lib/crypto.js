// lib/crypto.js
import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY missing');
}

const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
const AAD = Buffer.from('caught-wiki');

export function encryptTriple(plaintext) {
  let res = plaintext;
  for (let i = 0; i < 3; i++) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(AAD);
    const enc = Buffer.concat([cipher.update(res, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    res = `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
  }
  return res;
}

export function decryptTriple(ciphertext) {
  let res = ciphertext;
  for (let i = 0; i < 3; i++) {
    const [iv, tag, enc] = res.split(':');
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(AAD);
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    const dec = decipher.update(Buffer.from(enc, 'base64'));
    res = Buffer.concat([dec, decipher.final()]).toString('utf8');
  }
  return res;
}
