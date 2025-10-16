// lib/auth.js
import { serialize, parse } from 'cookie';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in environment variables');
}

export function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  res.setHeader('Set-Cookie', serialize('auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax'
  }));
}

export function getAuthUserId(cookies) {
  const cookieString = cookies?.auth || '';
  const parsed = parse(cookieString);
  const token = parsed.auth;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.userId;
  } catch (err) {
    return null;
  }
}
