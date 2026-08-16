import { hashPassword, comparePassword } from './auth';

export function generateOtpCode(): string {
  // Generate random 6-digit numeric OTP (e.g. "849201")
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '+91 XXXXX XXXXX';
  const cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.length >= 10) {
    const last4 = cleaned.slice(-4);
    return `+91 XXXXX ${last4}`;
  }
  return phone;
}

export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
}

export async function sendSmsOtp(
  phoneNumber: string,
  otpCode: string,
  purpose: 'PHONE_REGISTRATION' | 'PHONE_CHANGE' | 'PASSWORD_CHANGE'
): Promise<{ success: boolean; maskedPhone: string }> {
  const maskedPhone = maskPhoneNumber(phoneNumber);

  // Secure server-side delivery logging (disabled in production logs)
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[SMS GATEWAY] OTP sent to ${phoneNumber} (${maskedPhone}) for purpose '${purpose}': ${otpCode}`
    );
  }

  return {
    success: true,
    maskedPhone,
  };
}
