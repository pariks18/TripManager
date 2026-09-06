import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbStore } from '@/lib/dbStore';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    const existingUser = await dbStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    // Create user with isEmailVerified = false
    const user = await dbStore.createUser(name.trim(), cleanEmail, passwordHash, false);

    // Generate single-use cryptographically secure verification token (64 hex characters)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    await dbStore.createVerificationToken(user.id, rawVerificationToken, 24);

    // Send verification email
    await sendVerificationEmail(cleanEmail, rawVerificationToken, user.name);

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      message: "We've sent a verification email to your email address. Please verify your email before logging in.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}

