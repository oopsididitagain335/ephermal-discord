import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getGlobalDb } from '@/lib/db';

export async function POST(req) {
  const userId = getAuthUserId(req.cookies);
  if (!userId) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  const db = await getGlobalDb();
  await db.collection('users').deleteOne({ _id: new db.ObjectId(userId) });
  await db.collection('user_settings').deleteOne({ userId });
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', 'auth=; Max-Age=0; Path=/');
  return res;
}
