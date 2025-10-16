import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getGlobalDb } from '@/lib/db';
import { encryptTriple } from '@/lib/crypto';

export async function POST(req, { params }) {
  const userId = getAuthUserId(req.cookies);
  if (!userId) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  
  const { id: roomId } = params;
  const { username, text } = await req.json();
  if (!username?.trim() || !text?.trim()) return NextResponse.json({ error: 'Invalid' }, { status: 400 });

  const db = await getGlobalDb();
  const room = await db.collection('rooms').findOne({ _id: roomId });
  if (!room || room.activeConnections <= 0) return NextResponse.json({ error: 'Closed' }, { status: 404 });

  const msg = {
    id: Date.now().toString(),
    username: encryptTriple(username.trim()),
    text: encryptTriple(text.trim()),
    timestamp: new Date().toISOString()
  };

  await db.collection('rooms').updateOne(
    { _id: roomId },
    { $push: { messages: { $each: [msg], $slice: -100 } } }
  );

  return NextResponse.json({ ok: true });
}

export async function PUT(req, { params }) {
  const { id: roomId } = params;
  const { action } = await req.json();
  const db = await getGlobalDb();
  if (action === 'close') {
    await db.collection('rooms').deleteOne({ _id: roomId });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Invalid' }, { status: 400 });
}
