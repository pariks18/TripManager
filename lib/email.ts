import { Resend } from 'resend';

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
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'TripManager <onboarding@resend.dev>';
      const purposeTitle = purpose.replace(/_/g, ' ');

      const response = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: `🔐 Your TripManager Verification Code: ${otpCode}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; font-weight: 800; font-size: 20px; padding: 10px 18px; border-radius: 12px;">
                TS
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

      console.log(`[RESEND GATEWAY] Sent real email to ${email} (ID: ${response.data?.id})`);
    } catch (err: any) {
      console.error('[RESEND GATEWAY ERROR]: Failed to send email via Resend:', err);
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[SIMULATED EMAIL GATEWAY] OTP sent to ${email} (${maskedEmail}) for purpose '${purpose}': ${otpCode}`
      );
    }
  }

  return {
    success: true,
    maskedEmail,
  };
}
