import { NextResponse } from 'next/server';
import { comparePassword, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recoveryEmail, otp } = await request.json();
    if (!recoveryEmail || !otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Recovery email and 6-digit code are required' }, { status: 400 });
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        phoneNumber: cleanEmail,
        purpose: 'RECOVERY_EMAIL_VERIFICATION',
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum verification attempts exceeded. Please request a new code.' },
        { status: 400 }
      );
    }

    const isOtpValid = await comparePassword(cleanOtp, otpRecord.otpHash);
    if (!isOtpValid) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used and update User recoveryEmail
    await prisma.$transaction([
      prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: {
          usedAt: new Date(),
          verifiedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          recoveryEmail: cleanEmail,
          isRecoveryEmailVerified: true,
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '✓ Recovery email verified successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/recovery-email/verify-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 400 });
  }
}
