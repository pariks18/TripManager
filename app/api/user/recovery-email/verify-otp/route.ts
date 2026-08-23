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
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Valid 6-digit verification code is required' }, { status: 400 });
    }

    const cleanEmail = recoveryEmail ? recoveryEmail.trim().toLowerCase() : '';
    const cleanOtp = otp.trim();

    // Fetch latest active unused OTP for this user
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord || otpRecord.usedAt) {
      console.warn(`[RECOVERY EMAIL VERIFY 400]: No active unused OTP found for user ${sessionUser.id}`);
      return NextResponse.json(
        { error: 'No active verification code found. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      console.warn(`[RECOVERY EMAIL VERIFY 400]: OTP expired at ${otpRecord.expiresAt}`);
      return NextResponse.json(
        { error: 'This verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 5) {
      console.warn(`[RECOVERY EMAIL VERIFY 400]: Max attempts exceeded (${otpRecord.attempts})`);
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
      console.warn(`[RECOVERY EMAIL VERIFY 400]: Invalid code entered by user ${sessionUser.id}`);
      return NextResponse.json(
        { error: 'Invalid verification code. Please check the code and try again.' },
        { status: 400 }
      );
    }

    const targetRecoveryEmail = cleanEmail || otpRecord.phoneNumber || sessionUser.email;

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
          recoveryEmail: targetRecoveryEmail,
          isRecoveryEmailVerified: true,
          updatedAt: new Date(),
        },
      }),
    ]);

    console.log(`[RECOVERY EMAIL VERIFY SUCCESS]: User ${sessionUser.id} recovery email ${targetRecoveryEmail} verified!`);
    return NextResponse.json({
      success: true,
      message: '✓ Recovery email verified successfully',
    });
  } catch (error: any) {
    console.error('[API /api/user/recovery-email/verify-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 400 });
  }
}
