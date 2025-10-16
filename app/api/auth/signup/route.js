// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getGlobalDb } from '@/lib/db.js';
import { setAuthCookie } from '@/lib/auth.js';

export async function POST(request) {
  try {
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const db = await getGlobalDb();
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.collection('users').insertOne({
      email,
      username,
      password: hashedPassword,
      createdAt: new Date()
    });

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, result.insertedId.toString());
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
