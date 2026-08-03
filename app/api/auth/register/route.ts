import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { hashPassword, signJWT, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await dbStore.createUser(name, email, passwordHash);

    const token = await signJWT(user);
    await setAuthCookie(token);

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
