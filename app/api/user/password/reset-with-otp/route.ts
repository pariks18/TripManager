import { NextResponse } from 'next/server';
import { comparePassword, getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { otp, newPassword } = await request.json();

    if (!otp || typeof otp !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Valid 6-digit verification code and new password are required' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.trim();
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isRecoveryEmailVerified || !user.recoveryEmail) {
      return NextResponse.json(
        { error: 'No verified recovery email found. Please register and verify a recovery email first.' },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        purpose: 'PASSWORD_RESET_RECOVERY_EMAIL',
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active password reset verification code found. Please request a new code.' },
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
        { error: 'Invalid verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

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
          password: newPasswordHash,
          updatedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '✓ Password reset successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/password/reset-with-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 400 });
  }
}
