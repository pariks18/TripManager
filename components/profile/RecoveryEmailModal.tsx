'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Mail, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface RecoveryEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecoveryEmail?: string | null;
  onSuccess: () => void;
}

export const RecoveryEmailModal: React.FC<RecoveryEmailModalProps> = ({
  isOpen,
  onClose,
  currentRecoveryEmail,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'INPUT_EMAIL' | 'VERIFY_OTP'>('INPUT_EMAIL');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    if (currentRecoveryEmail) {
      setRecoveryEmail(currentRecoveryEmail);
    } else {
      setRecoveryEmail('');
    }
    setStep('INPUT_EMAIL');
    setOtp('');
    setError('');
  }, [isOpen, currentRecoveryEmail]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/recovery-email/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send verification code');

      setMaskedEmail(data.maskedEmail || recoveryEmail);
      if (data.debugOtp) setDebugOtp(data.debugOtp);

      showToast(data.message || `✓ Verification code sent to ${data.maskedEmail || recoveryEmail}`, 'info', 'Code Sent');
      setStep('VERIFY_OTP');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Request Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/recovery-email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recoveryEmail, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify recovery email');

      showToast(data.message || '✓ Recovery email verified successfully', 'success', 'Email Verified');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Verification Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentRecoveryEmail ? 'Change Recovery Email' : 'Add Recovery Email'}
    >
      {step === 'INPUT_EMAIL' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-1.5 text-xs text-purple-950">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Mail className="w-4 h-4 text-purple-600" />
              <span>Recovery Email Verification</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Add a real, accessible email address to recover your password if you forget it. Your login email will remain unchanged.
            </p>
          </div>

          <Input
            type="email"
            label="Recovery Email Address"
            placeholder="user@example.com"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            required
          />

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" isLoading={isLoading} className="flex-1 text-xs font-bold py-3">
              Send Code
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Code sent to {maskedEmail}</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              We sent a 6-digit verification code to <strong>{maskedEmail}</strong>. Code expires in 5 minutes.
            </p>
          </div>

          {debugOtp && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-800 text-center">
              Dev Mode Helper — Verification Code: <strong>{debugOtp}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-center tracking-[0.4em] text-2xl font-mono font-black rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setStep('INPUT_EMAIL')}
              className="font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Change Recovery Email
            </button>

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
      )}
    </Modal>
  );
};
