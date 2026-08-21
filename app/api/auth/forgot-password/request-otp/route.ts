import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp, maskEmail } from '@/lib/email';
import { generateOtpCode, sanitizePhoneNumber, sendSmsOtp, maskPhoneNumber } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { emailOrPhone } = await request.json();

    if (!emailOrPhone || typeof emailOrPhone !== 'string') {
      return NextResponse.json(
        { error: 'Email address or mobile number is required' },
        { status: 400 }
      );
    }

    const cleanInput = emailOrPhone.trim();
    const cleanEmail = cleanInput.toLowerCase();
    const sanitizedPhone = sanitizePhoneNumber(cleanInput);

    // Find user by primary email, recovery email, or mobile number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          { recoveryEmail: cleanEmail },
          { mobile: sanitizedPhone },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found matching the provided email or mobile number.' },
        { status: 404 }
      );
    }

    const purpose = 'PASSWORD_RESET';

    // Rate limiting / Cooldown check (60 seconds)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
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

    // Determine target recipient (email vs sms)
    let targetRecipient: string;
    let isSms = false;

    if (cleanInput.replace(/\D/g, '').length >= 10 && user.mobile && user.isMobileVerified) {
      targetRecipient = user.mobile;
      isSms = true;
    } else if (user.recoveryEmail && user.isRecoveryEmailVerified) {
      targetRecipient = user.recoveryEmail;
    } else {
      targetRecipient = user.email;
    }

    await prisma.otpVerification.create({
      data: {
        id: generateObjectId(),
        userId: user.id,
        phoneNumber: targetRecipient,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    let maskedRecipient: string;
    if (isSms) {
      const res = await sendSmsOtp(targetRecipient, rawOtp, 'PASSWORD_CHANGE');
      maskedRecipient = res.maskedPhone;
    } else {
      const res = await sendEmailOtp(targetRecipient, rawOtp, 'PASSWORD_RESET_RECOVERY_EMAIL');
      maskedRecipient = res.maskedEmail;
    }

    return NextResponse.json({
      success: true,
      maskedRecipient,
      userId: user.id,
      message: `✓ Verification code sent to ${maskedRecipient}`,
      debugOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (error: any) {
    console.error('[API /api/auth/forgot-password/request-otp error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset code' },
      { status: 500 }
    );
  }
}
