import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmailOtp } from '@/lib/email';
import { generateOtpCode } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { recoveryEmail } = await request.json();
    if (!recoveryEmail || typeof recoveryEmail !== 'string' || !recoveryEmail.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid recovery email address' }, { status: 400 });
    }

    const cleanEmail = recoveryEmail.trim().toLowerCase();
    const purpose = 'RECOVERY_EMAIL_VERIFICATION';

    // Rate limiting: 60-second cooldown
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
        { error: `Please wait ${waitSeconds} seconds before requesting a new verification code.` },
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
        phoneNumber: cleanEmail,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
        usedAt: null,
      },
    });

    const { maskedEmail } = await sendEmailOtp(cleanEmail, rawOtp, purpose);

    return NextResponse.json({
      success: true,
      maskedEmail,
      message: `✓ Verification code sent to ${maskedEmail}`,
    });
  } catch (error: any) {
    console.error('[API /api/user/recovery-email/request-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to request OTP' }, { status: 400 });
  }
}
