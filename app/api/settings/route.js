import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { saveUserSettings, loadUserSettings } from '@/lib/db';
import { getGlobalDb } from '@/lib/db';

export async function GET(req) {
  const userId = getAuthUserId(req.cookies);
  if (!userId) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  const db = await getGlobalDb();
  const user = await db.collection('users').findOne({ _id: new db.ObjectId(userId) });
  const settings = await loadUserSettings(userId, user?.settings?.mongodbUri || null);
  return NextResponse.json(settings);
}

export async function POST(req) {
  const userId = getAuthUserId(req.cookies);
  if (!userId) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  const body = await req.json();
  const { mongodbUri, ...other } = body;

  const db = await getGlobalDb();
  if (mongodbUri !== undefined) {
    await db.collection('users').updateOne(
      { _id: new db.ObjectId(userId) },
      { $set: { 'settings.mongodbUri': mongodbUri || null } }
    );
  }

  await saveUserSettings(userId, other, mongodbUri || null);
  return NextResponse.json({ ok: true });
}
