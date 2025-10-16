import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getGlobalDb } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password, username } = await req.json();
  const db = await getGlobalDb();
  const exists = await db.collection('users').findOne({ email });
  if (exists) return NextResponse.json({ error: 'Email taken' }, { status: 400 });
  const hash = await bcrypt.hash(password, 12);
  const res = await db.collection('users').insertOne({ email, username, password: hash, createdAt: new Date() });
  setAuthCookie(NextResponse.json({ ok: true }), res.insertedId.toString());
  return NextResponse.json({ ok: true });
}
