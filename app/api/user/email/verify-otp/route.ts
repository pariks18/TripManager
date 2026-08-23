import { NextResponse } from 'next/server';
import { comparePassword, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { otp } = await request.json();
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: '6-digit verification code is required' }, { status: 400 });
    }

    const cleanOtp = otp.trim();

    // Fetch the latest unused OTP record for this user
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        purpose: { in: ['PRIMARY_EMAIL_VERIFICATION', 'RECOVERY_EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PASSWORD_RESET_RECOVERY_EMAIL'] },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      console.warn(`[VERIFY OTP 400]: No active unused OTP found for user ${sessionUser.id}`);
      return NextResponse.json(
        { error: 'No active verification code found. Please click "Resend Code" to get a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      console.warn(`[VERIFY OTP 400]: OTP expired at ${otpRecord.expiresAt}`);
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      console.warn(`[VERIFY OTP 400]: Max attempts exceeded (${otpRecord.attempts})`);
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
      console.warn(`[VERIFY OTP 400]: Invalid code entered by user ${sessionUser.id}`);
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used and update User isEmailVerified
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
          isEmailVerified: true,
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log(`[VERIFY OTP SUCCESS]: User ${sessionUser.id} email verified!`);
    return NextResponse.json({
      success: true,
      message: '✓ Email address verified successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/email/verify-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 400 });
  }
}
