import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/dbStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { status: 'INVALID_TOKEN', error: 'Verification token is missing from request.' },
        { status: 400 }
      );
    }

    const verificationRecord = await dbStore.findVerificationToken(token);

    if (!verificationRecord) {
      return NextResponse.json(
        {
          status: 'INVALID_TOKEN',
          error: 'This verification link is invalid or has already been used.',
        },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(verificationRecord.expiresAt)) {
      return NextResponse.json(
        {
          status: 'EXPIRED_TOKEN',
          error: 'This verification link has expired. Please request a new one.',
          email: verificationRecord.user.email,
        },
        { status: 400 }
      );
    }

    // Mark email as verified and delete used tokens
    await dbStore.markEmailAsVerified(verificationRecord.userId);

    return NextResponse.json({
      status: 'SUCCESS',
      message: 'Your email address has been verified successfully! You can now log in.',
      email: verificationRecord.user.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'FAILED', error: error.message || 'Email verification failed' },
      { status: 500 }
    );
  }
}
