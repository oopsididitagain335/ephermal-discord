// app/api/auth/delete/route.js
import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth.js';
import { getGlobalDb } from '@/lib/db.js';

export async function POST(request) {
  try {
    const userId = getAuthUserId(request.cookies);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getGlobalDb();
    const objectId = new db.ObjectId(userId);

    // Delete user account
    await db.collection('users').deleteOne({ _id: objectId });
    // Delete user settings
    await db.collection('user_settings').deleteOne({ userId });

    // Optional: delete all rooms owned by user (not implemented here)

    const response = NextResponse.json({ success: true });
    // Clear auth cookie
    response.headers.set('Set-Cookie', 'auth=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax');
    return response;
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
