// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getGlobalDb } from '@/lib/db.js';
import { setAuthCookie } from '@/lib/auth.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const db = await getGlobalDb();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    setAuthCookie(response, user._id.toString
