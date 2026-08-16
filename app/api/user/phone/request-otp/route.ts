import { NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOtpCode, sanitizePhoneNumber, sendSmsOtp } from '@/lib/sms';
import { generateObjectId } from '@/lib/utils';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mobileNumber } = await request.json();
    if (!mobileNumber || typeof mobileNumber !== 'string') {
      return NextResponse.json({ error: 'Valid mobile number is required' }, { status: 400 });
    }

    const sanitizedPhone = sanitizePhoneNumber(mobileNumber);
    if (sanitizedPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number' }, { status: 400 });
    }

    // Duplicate check: Verify phone is not already verified by ANOTHER account
    const existingVerifiedUser = await prisma.user.findFirst({
      where: {
        mobile: sanitizedPhone,
        isMobileVerified: true,
        id: { not: sessionUser.id },
      },
    });

    if (existingVerifiedUser) {
      return NextResponse.json(
        { error: 'This mobile number is already registered and verified on another account.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const purpose = user.isMobileVerified ? 'PHONE_CHANGE' : 'PHONE_REGISTRATION';

    // Rate limiting / Cooldown check: Must wait 60s between OTP requests
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
        { error: `Please wait ${waitSeconds} seconds before requesting a new OTP.` },
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
        phoneNumber: sanitizedPhone,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
      },
    });

    const { maskedPhone } = await sendSmsOtp(sanitizedPhone, rawOtp, purpose);

    return NextResponse.json({
      success: true,
      maskedPhone,
      purpose,
      message: `✓ OTP sent to ${maskedPhone}`,
      // Pass OTP in dev mode for UI demo testing
      debugOtp: process.env.NODE_ENV !== 'production' ? rawOtp : undefined,
    });
  } catch (error: any) {
    console.error('[API /api/user/phone/request-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to request OTP' }, { status: 400 });
  }
}
