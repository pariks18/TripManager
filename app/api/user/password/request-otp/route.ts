import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOtpCode, maskPhoneNumber, sendSmsOtp } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // REQUIREMENT 5: Check if user has a verified phone number
    if (!user.isMobileVerified || !user.mobile) {
      return NextResponse.json(
        {
          error:
            'Phone number not registered. Register and verify your mobile number first to enable OTP-based password changes.',
          code: 'PHONE_NOT_REGISTERED',
        },
        { status: 400 }
      );
    }

    const purpose = 'PASSWORD_CHANGE';

    // Cooldown Check (60 seconds)
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
        { error: `Please wait ${waitSeconds} seconds before requesting a new password-change OTP.` },
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
        phoneNumber: user.mobile,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    const { maskedPhone } = await sendSmsOtp(user.mobile, rawOtp, purpose);

    return NextResponse.json({
      success: true,
      maskedPhone,
      purpose,
      message: `✓ OTP sent to ${maskedPhone}`,
      // Pass OTP in dev mode for UI demo testing
      debugOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (error: any) {
    console.error('[API /api/user/password/request-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to request password-change OTP' }, { status: 400 });
  }
}
