import { NextResponse } from 'next/server';
import { comparePassword, getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, otp, newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

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

    // Path A: Normal password update with Current Password
    if (currentPassword && typeof currentPassword === 'string') {
      const isCurrentValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect. Please try again.' },
          { status: 400 }
        );
      }

      const newPasswordHash = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          password: newPasswordHash,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: '✓ Password updated successfully',
      });
    }

    // Path B: Password change with OTP
    if (otp && typeof otp === 'string') {
      const cleanOtp = otp.trim();

      const otpRecord = await prisma.otpVerification.findFirst({
        where: {
          userId: sessionUser.id,
          OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord || otpRecord.usedAt) {
        console.warn(`[SECURITY PASSWORD 400]: No active unused OTP found for user ${sessionUser.id}`);
        return NextResponse.json(
          { error: 'No active verification code found. Please request a new code.' },
          { status: 400 }
        );
      }

      if (otpRecord.expiresAt < new Date()) {
        console.warn(`[SECURITY PASSWORD 400]: OTP expired at ${otpRecord.expiresAt}`);
        return NextResponse.json(
          { error: 'This verification code has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      if (otpRecord.attempts >= 5) {
        console.warn(`[SECURITY PASSWORD 400]: Max attempts exceeded (${otpRecord.attempts})`);
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
        console.warn(`[SECURITY PASSWORD 400]: Invalid code entered by user ${sessionUser.id}`);
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

      console.log(`[SECURITY PASSWORD SUCCESS]: Password updated for user ${sessionUser.id}`);
      return NextResponse.json({
        success: true,
        message: '✓ Password changed successfully',
      });
    }

    return NextResponse.json(
      { error: 'Either current password or verification code is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API /api/user/security/password error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to update password' }, { status: 400 });
  }
}
