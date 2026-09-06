import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email address and verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { error: 'Please enter a valid 6-digit numeric verification code.' },
        { status: 400 }
      );
    }

    const result = await dbStore.verifyEmailOtp(cleanEmail, cleanOtp);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'Verification failed.',
          reason: result.reason,
          attemptsRemaining: result.attemptsRemaining,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your email address has been verified successfully! You can now log in.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
