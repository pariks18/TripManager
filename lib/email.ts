import nodemailer from 'nodemailer';

export function maskEmail(email?: string | null): string {
  if (!email) return 'c***@domain.com';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export async function sendEmailOtp(
  email: string,
  otpCode: string,
  purpose: string
): Promise<{ success: boolean; maskedEmail: string }> {
  const maskedEmail = maskEmail(email);
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      const purposeTitle = purpose.replace(/_/g, ' ');

      await transporter.sendMail({
        from: `TripNizer <${gmailUser}>`,
        to: email,
        subject: `🔐 Your TripNizer Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; font-size: 20px; padding: 10px 18px; border-radius: 12px;">
                TN
              </div>
              <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin-top: 12px; margin-bottom: 4px;">Verification Code</h2>
              <p style="color: #64748b; font-size: 13px; margin: 0;">For ${purposeTitle}</p>
            </div>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 16px; margin: 20px 0;">
              <span style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #059669;">${otpCode}</span>
            </div>

            <p style="color: #475569; font-size: 13px; line-height: 1.5; text-align: center; margin-bottom: 20px;">
              Enter this 6-digit code to verify your action. This code will expire in <strong>5 minutes</strong>.
            </p>

            <div style="border-t: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      });

      console.log(`[GMAIL SMTP SUCCESS] Real email sent to ${email}`);
    } catch (err: any) {
      console.error('[GMAIL SMTP ERROR] Failed to send email via Nodemailer:', err.message || err);
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[SIMULATED EMAIL GATEWAY LOG] OTP code for ${email} (${maskedEmail}): ${otpCode}`
      );
    }
  }

  return {
    success: true,
    maskedEmail,
  };
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<{ success: boolean; maskedEmail: string; verificationUrl: string }> {
  const maskedEmail = maskEmail(email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  const recipientName = name || 'Traveler';

  if (gmailUser && gmailAppPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      await transporter.sendMail({
        from: `TripNizer <${gmailUser}>`,
        to: email,
        subject: `✉️ Verify your TripNizer Email Address`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px 24px; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);">
            <!-- Header / Branding -->
            <div style="text-align: center; margin-bottom: 28px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; font-size: 22px; border-radius: 14px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                TN
              </div>
              <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-top: 14px; margin-bottom: 4px; letter-spacing: -0.5px;">TripNizer</h1>
              <p style="color: #64748b; font-size: 13px; margin: 0;">Smart Group Trip Expense & Itinerary Manager</p>
            </div>
            
            <!-- Main Content -->
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
              <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Verify your email address</h2>
              <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
                Hi <strong>${recipientName}</strong>,<br/>
                Thanks for registering on TripNizer! Please click the button below to verify your email address and activate your account.
              </p>

              <!-- Action Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); transition: all 0.2s ease;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-bottom: 0; text-align: center;">
                ⏱️ This verification link is single-use and will expire in <strong>24 hours</strong>.
              </p>
            </div>

            <!-- Fallback URL -->
            <div style="border-t: 1px solid #f1f5f9; padding-top: 20px;">
              <p style="color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 8px;">If the button above doesn't work, copy and paste this link into your browser:</p>
              <p style="font-family: monospace; font-size: 11px; color: #059669; word-break: break-all; margin: 0; background-color: #f1f5f9; padding: 10px; border-radius: 8px;">
                ${verificationUrl}
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 24px; text-align: center;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">If you didn't create a TripNizer account, please ignore this email.</p>
            </div>
          </div>
        `,
      });

      console.log(`[GMAIL SMTP SUCCESS] Real verification email sent to ${email}`);
    } catch (err: any) {
      console.error('[GMAIL SMTP ERROR] Failed to send email via Nodemailer:', err.message || err);
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[SIMULATED EMAIL GATEWAY LOG] Verification link for ${email} (${maskedEmail}): ${verificationUrl}`
      );
    }
  }

  return {
    success: true,
    maskedEmail,
    verificationUrl,
  };
}

