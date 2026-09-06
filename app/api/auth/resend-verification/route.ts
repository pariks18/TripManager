import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbStore } from '@/lib/dbStore';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dbStore.findUserByEmail(cleanEmail);

    // Prevent email enumeration: return generic success message even if user does not exist
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists with that email, a new verification link has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "This email address is already verified. You can log in directly.",
      });
    }

    // Generate new secure verification token (invalidates old ones)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    await dbStore.createVerificationToken(user.id, rawVerificationToken, 24);

    // Send new email
    await sendVerificationEmail(cleanEmail, rawVerificationToken, user.name);

    return NextResponse.json({
      success: true,
      message: "A new verification email has been sent to your email address.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
