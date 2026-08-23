import { NextResponse } from 'next/server';
import { comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { emailOrPhone, otp, newPassword } = await request.json();

    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'Valid 6-digit verification code and new password are required' },
        { status: 400 }
      );
    }

    const cleanInput = emailOrPhone.trim();
    const cleanEmail = cleanInput.toLowerCase();
    const cleanOtp = otp.trim();

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { recoveryEmail: cleanEmail },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found matching the provided email address.' },
        { status: 404 }
      );
    }

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.usedAt) {
      console.warn(`[PUBLIC FORGOT PASSWORD 400]: No active unused OTP found for user ${user.id}`);
      return NextResponse.json(
        { error: 'No active password reset verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      console.warn(`[PUBLIC FORGOT PASSWORD 400]: OTP expired at ${otpRecord.expiresAt}`);
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      console.warn(`[PUBLIC FORGOT PASSWORD 400]: Max attempts exceeded (${otpRecord.attempts})`);
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
      console.warn(`[PUBLIC FORGOT PASSWORD 400]: Invalid code entered by user ${user.id}`);
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
        where: { id: user.id },
        data: {
          password: newPasswordHash,
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log(`[PUBLIC FORGOT PASSWORD SUCCESS]: User ${user.id} password reset successfully!`);
    return NextResponse.json({
      success: true,
      message: '✓ Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/reset-with-otp error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
