import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp } from '@/lib/email';
import { generateOtpCode } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isRecoveryEmailVerified || !user.recoveryEmail) {
      return NextResponse.json(
        {
          error: 'No verified recovery email found. Register and verify a recovery email first to enable password recovery.',
          code: 'RECOVERY_EMAIL_NOT_VERIFIED',
        },
        { status: 400 }
      );
    }

    const purpose = 'PASSWORD_RESET_RECOVERY_EMAIL';

    // Rate limit cooldown check (60s)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        purpose,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil((recentOtp.createdAt.getTime() + 60000 - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting a new password reset code.` },
        { status: 429 }
      );
    }

    const rawOtp = generateOtpCode();
    const otpHash = await hashPassword(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    await prisma.otpVerification.create({
      data: {
        id: generateObjectId(),
        userId: sessionUser.id,
        phoneNumber: user.recoveryEmail, // Target recovery email address
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    const { maskedEmail } = await sendEmailOtp(user.recoveryEmail, rawOtp, purpose);

    return NextResponse.json({
      success: true,
      maskedEmail,
      message: `✓ Password reset code sent to ${maskedEmail}`,
      debugOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (error: any) {
    console.error('[API /api/user/password/reset-request-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to send password reset code' }, { status: 400 });
  }
}
