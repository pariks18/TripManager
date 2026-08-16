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
  purpose: 'RECOVERY_EMAIL_VERIFICATION' | 'PASSWORD_RESET_RECOVERY_EMAIL'
): Promise<{ success: boolean; maskedEmail: string }> {
  const maskedEmail = maskEmail(email);

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[EMAIL GATEWAY] OTP sent to ${email} (${maskedEmail}) for purpose '${purpose}': ${otpCode}`
    );
  }

  return {
    success: true,
    maskedEmail,
  };
}
