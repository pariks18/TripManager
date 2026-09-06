import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbStore } from '@/lib/dbStore';
import { hashPassword } from '@/lib/auth';
import { sendEmailOtp } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, password, dob, gender } = await request.json();

    if (!name || !email || !password || !dob || !gender) {
      return NextResponse.json(
        { error: 'Name, email, password, date of birth, and gender are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    // Validate Date of Birth
    const parsedDob = new Date(dob);
    if (isNaN(parsedDob.getTime())) {
      return NextResponse.json({ error: 'Please enter a valid Date of Birth' }, { status: 400 });
    }

    if (parsedDob > new Date()) {
      return NextResponse.json({ error: 'Date of birth cannot be in the future' }, { status: 400 });
    }

    // Validate Gender
    const ALLOWED_GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
    const formattedGender = gender.trim();
    if (!ALLOWED_GENDERS.includes(formattedGender)) {
      return NextResponse.json(
        { error: `Gender must be one of: ${ALLOWED_GENDERS.join(', ')}` },
        { status: 400 }
      );
    }

    const existingUser = await dbStore.findUserByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    // Create user with isEmailVerified = false, saving dob and gender immediately
    const user = await dbStore.createUser(
      name.trim(),
      cleanEmail,
      passwordHash,
      false,
      dob.trim(),
      formattedGender
    );

    // Generate secure 6-digit numeric OTP (100000 - 999999)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    await dbStore.createEmailOtp(user.id, cleanEmail, otpCode, 10);

    // Send email with 6-digit OTP
    await sendEmailOtp(cleanEmail, otpCode, 'ACCOUNT_REGISTRATION');

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: cleanEmail,
      message: "We've sent a 6-digit verification code to your email. Please verify to activate your account.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}



