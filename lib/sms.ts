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
  const fast2smsApiKey = process.env.FAST2SMS_API_KEY;

  const sanitizedPhone = sanitizePhoneNumber(phoneNumber);
  const cleanDigits = sanitizedPhone.replace(/\D/g, '');
  const tenDigitPhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

  // Real SMS Delivery via Fast2SMS (Free Trial / Indian +91 SMS Gateway)
  if (fast2smsApiKey) {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: tenDigitPhone,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok || !resData.return) {
        console.error('[SMS GATEWAY ERROR] Failed to send SMS via Fast2SMS:', resData);
      } else {
        console.log(`[SMS GATEWAY SUCCESS] Real SMS sent to +91 ${tenDigitPhone}`);
      }
    } catch (err: any) {
      console.error('[SMS GATEWAY EXCEPTION]:', err.message || err);
    }
  }

  // Development Fallback Log
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[DEV SMS GATEWAY LOG] Real OTP code for +91 ${tenDigitPhone} (${purpose}): ${otpCode}`
    );
  }

  return {
    success: true,
    maskedPhone,
  };
}
