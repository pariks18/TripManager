import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp } from '@/lib/email';
import { generateOtpCode } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { emailOrPhone } = await request.json();

    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const cleanInput = emailOrPhone.trim();
    const cleanEmail = cleanInput.toLowerCase();

    // Find user by primary email or recovery email
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

    const purpose = 'PASSWORD_RESET';

    // Rate limiting / Cooldown check (60 seconds)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        purpose: { in: ['PASSWORD_RESET', 'PASSWORD_RESET_RECOVERY_EMAIL', 'PASSWORD_CHANGE'] },
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

    const targetRecipient = user.recoveryEmail && user.isRecoveryEmailVerified ? user.recoveryEmail : user.email;

    await prisma.otpVerification.create({
      data: {
        id: generateObjectId(),
        userId: user.id,
        phoneNumber: targetRecipient,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
        usedAt: null,
      },
    });

    const { maskedEmail } = await sendEmailOtp(targetRecipient, rawOtp, purpose);

    return NextResponse.json({
      success: true,
      maskedRecipient: maskedEmail,
      userId: user.id,
      message: `✓ Verification code sent to ${maskedEmail}`,
    });
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/request-otp error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset code' },
      { status: 500 }
    );
  }
}
