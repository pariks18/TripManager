import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';
import { comparePassword, signJWT, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await dbStore.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email };
    const token = await signJWT(sessionUser);
    await setAuthCookie(token);

    return NextResponse.json({ user: sessionUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
