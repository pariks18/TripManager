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
        { error: 'Valid 6-digit OTP and new password are required' },
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

    if (!user.isMobileVerified || !user.mobile) {
      return NextResponse.json(
        {
          error:
            'Phone number not registered. Register and verify your mobile number first to enable OTP-based password changes.',
        },
        { status: 400 }
      );
    }

    // Fetch active password-change OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        purpose: 'PASSWORD_CHANGE',
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active password-change OTP found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Expiry Check (5 mins)
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Attempt Limit Check
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // OTP Hash Match Check
    const isOtpValid = await comparePassword(cleanOtp, otpRecord.otpHash);
    if (!isOtpValid) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: 'Invalid OTP. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Hash the new password using project standard hashPassword
    const newPasswordHash = await hashPassword(newPassword);

    // Transaction: Mark OTP as used and update User password
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
      message: '✓ Password changed successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/security/password error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 400 });
  }
}
