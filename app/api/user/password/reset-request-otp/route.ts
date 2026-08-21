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
    const body = await request.json().catch(() => ({}));
    const targetChoice = body?.targetEmail || 'PRIMARY';

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const purpose = 'PASSWORD_RESET_RECOVERY_EMAIL';

    // Rate limit cooldown check (60s)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        purpose: { in: ['PASSWORD_RESET_RECOVERY_EMAIL', 'PASSWORD_RESET', 'PASSWORD_CHANGE'] },
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

    let targetRecipient: string;

    if (targetChoice === 'RECOVERY' && user.isRecoveryEmailVerified && user.recoveryEmail) {
      targetRecipient = user.recoveryEmail;
    } else {
      targetRecipient = user.email;
    }

    const rawOtp = generateOtpCode();
    const otpHash = await hashPassword(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    await prisma.otpVerification.create({
      data: {
        id: generateObjectId(),
        userId: sessionUser.id,
        phoneNumber: targetRecipient,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    const { maskedEmail } = await sendEmailOtp(targetRecipient, rawOtp, purpose);

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
