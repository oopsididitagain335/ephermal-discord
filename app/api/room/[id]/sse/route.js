import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getGlobalDb } from '@/lib/db';
import { decryptTriple } from '@/lib/crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function deleteRoom(id, db) {
  await db.collection('rooms').deleteOne({ _id: id });
}

export async function GET(req, { params }) {
  const userId = getAuthUserId(req.cookies);
  if (!userId) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  
  const { id: roomId } = params;
  const isDM = roomId.startsWith('dm_');
  const db = await getGlobalDb(); // DMs always use global

  await db.collection('rooms').updateOne(
    { _id: roomId },
    { $setOnInsert: { messages: [], createdAt: new Date() }, $inc: { activeConnections: 1 } },
    { upsert: true }
  );

  let room = await db.collection('rooms').findOne({ _id: roomId });
  const cleanup = async () => {
    const r = await db.collection('rooms').findOne({ _id: roomId });
    if (r && r.activeConnections > 0) {
      const n = r.activeConnections - 1;
      if (n <= 0) {
        await deleteRoom(roomId, db);
      } else {
        await db.collection('rooms').updateOne({ _id: roomId }, { $set: { activeConnections: n } });
      }
    }
  };

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data) => controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      if (room) {
        const msgs = (room.messages || []).map(m => ({
          ...m,
          username: decryptTriple(m.username),
          text: decryptTriple(m.text)
        }));
        send({ type: 'init', messages: msgs, active: room.activeConnections });
      }

      const poll = setInterval(async () => {
        room = await db.collection('rooms').findOne({ _id: roomId });
        if (!room) {
          send({ type: 'closed' });
          controller.close();
          clearInterval(poll);
          return;
        }
        const msgs = (room.messages || []).map(m => ({
          ...m,
          username: decryptTriple(m.username),
          text: decryptTriple(m.text)
        }));
        send({ type: 'update', messages: msgs, active: room.activeConnections });
      }, 1200);

      const hb = setInterval(() => controller.enqueue(enc.encode(': ping\n\n')), 20000);
      const close = () => { clearInterval(poll); clearInterval(hb); cleanup(); controller.close(); };
      if (req.socket) { req.socket.on('close', close); req.socket.on('error', close); }
    },
    cancel() { cleanup(); }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
