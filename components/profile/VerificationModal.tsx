'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmail?: string;
  targetValue?: string;
  targetType?: 'EMAIL' | 'MOBILE';
  onVerified: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  targetEmail,
  targetValue,
  onVerified,
}) => {
  const { showToast } = useToast();
  const emailToVerify = targetEmail || targetValue || '';
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState(emailToVerify);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setOtpCode('');
      setError('');
      handleRequestOtp();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async () => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/user/email/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          showToast('An active verification code was recently sent to your email.', 'info', 'Code Active');
          setCooldown(30);
          return;
        }
        throw new Error(data.error || 'Failed to send verification code');
      }

      setMaskedEmail(data.maskedEmail || emailToVerify);
      showToast(data.message || `✓ Verification code sent to ${data.maskedEmail || emailToVerify}`, 'info', 'Code Sent');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Request Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify email');

      showToast(data.message || '✓ Email address verified successfully', 'success', 'Email Verified');
      onVerified();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Verification Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Verify Primary Email Address">
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verification Code Sent</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            A 6-digit verification code has been sent to <strong>{maskedEmail}</strong>. Code expires in 5 minutes.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-center tracking-[0.4em] text-2xl font-mono font-black rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            required
          />
        </div>

        <div className="flex items-center justify-end text-xs text-slate-500 pt-1">
          {cooldown > 0 ? (
            <span className="text-[11px] font-bold text-slate-400">
              Resend code in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRequestOtp}
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Resend Code
            </button>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" isLoading={isLoading} className="flex-1 text-xs font-bold py-3">
            Verify Email
          </Button>
        </div>
      </form>
    </Modal>
  );
};
