import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbStore } from '@/lib/dbStore';
import { sendEmailOtp } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dbStore.findUserByEmail(cleanEmail);

    // Prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, a new verification code has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "This email address is already verified. You can log in directly.",
      });
    }

    // Check resend cooldown (30 seconds)
    const cooldownCheck = await dbStore.canResendEmailOtp(cleanEmail, 30);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        {
          error: `Please wait ${cooldownCheck.waitSeconds} seconds before requesting a new code.`,
          waitSeconds: cooldownCheck.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Generate new 6-digit numeric OTP
    const newOtpCode = crypto.randomInt(100000, 1000000).toString();
    await dbStore.createEmailOtp(user.id, cleanEmail, newOtpCode, 10);

    // Send email with new OTP
    await sendEmailOtp(cleanEmail, newOtpCode, 'ACCOUNT_REGISTRATION');

    return NextResponse.json({
      success: true,
      message: "A new 6-digit verification code has been sent to your email address.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}
