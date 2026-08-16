import { NextResponse } from 'next/server';
import { comparePassword, getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizePhoneNumber } from '@/lib/sms';

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { mobileNumber, otp } = await request.json();
    if (!mobileNumber || !otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Mobile number and 6-digit OTP are required' }, { status: 400 });
    }

    const sanitizedPhone = sanitizePhoneNumber(mobileNumber);
    const cleanOtp = otp.trim();

    // Fetch the most recent active OTP record for phone verification
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId: sessionUser.id,
        phoneNumber: sanitizedPhone,
        purpose: { in: ['PHONE_REGISTRATION', 'PHONE_CHANGE'] },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No active OTP found. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Expiry Check (5 mins)
    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Attempts Check
    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'Maximum OTP verification attempts exceeded. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Hash Match Check
    const isOtpValid = await comparePassword(cleanOtp, otpRecord.otpHash);
    if (!isOtpValid) {
      // Increment attempt counter
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: 'Invalid OTP. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: {
        usedAt: new Date(),
        verifiedAt: new Date(),
      },
    });

    // Update User mobile number and set isMobileVerified = true
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        mobile: sanitizedPhone,
        isMobileVerified: true,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        isMobileVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '✓ Mobile number verified successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('[API /api/user/phone/verify-otp error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify OTP' }, { status: 400 });
  }
}
