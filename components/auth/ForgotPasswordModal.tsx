'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Lock, ShieldCheck, AlertCircle, RefreshCw, Mail, ArrowLeft } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  initialEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);

  const [emailOrPhone, setEmailOrPhone] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [maskedRecipient, setMaskedRecipient] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmailOrPhone(initialEmail);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setDebugOtp(null);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!emailOrPhone || !emailOrPhone.trim()) {
      setError('Please enter your email address or mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send password reset code');

      setMaskedRecipient(data.maskedRecipient);
      if (data.debugOtp) setDebugOtp(data.debugOtp);

      showToast(data.message || `✓ Reset code sent to ${data.maskedRecipient}`, 'info', 'Code Sent');
      setStep(2);
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Request Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password/reset-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), otp: otp.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showToast('✓ Password reset successfully! You can now log in with your new password.', 'success', 'Password Reset');
      onSuccess(emailOrPhone);
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error', 'Password Reset Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Enter your Email or Mobile Number</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              We will send a 6-digit verification code to your registered email address or mobile phone.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email or Mobile Number
            </label>
            <Input
              type="text"
              placeholder="you@example.com or +91XXXXXXXXXX"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />
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
              Send Reset Code
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Enter verification code sent to {maskedRecipient}</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Check your inbox or SMS for the 6-digit code.
            </p>
          </div>

          {debugOtp && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-800 text-center">
              Dev Mode Helper — Reset Code: <strong>{debugOtp}</strong>
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

          <Input
            type="password"
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            type="password"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Change Email/Phone
            </button>

            {cooldown > 0 ? (
              <span className="text-[11px] font-bold text-slate-400">
                Resend code in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
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
              Reset Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
