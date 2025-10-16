import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getGlobalDb } from '@/lib/db';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  const { email, password } = await req.json();
  const db = await getGlobalDb();
  const user = await db.collection('users').findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  }
  setAuthCookie(NextResponse.json({ ok: true }), user._id.toString());
  return NextResponse.json({ ok: true });
}
