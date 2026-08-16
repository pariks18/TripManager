'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Smartphone, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMobile?: string | null;
  isChangeMode?: boolean;
  onSuccess: () => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  currentMobile,
  isChangeMode = false,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'INPUT_PHONE' | 'VERIFY_OTP'>('INPUT_PHONE');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  useEffect(() => {
    if (currentMobile && !isChangeMode) {
      setMobileNumber(currentMobile);
    } else {
      setMobileNumber('');
    }
    setStep('INPUT_PHONE');
    setOtp('');
    setError('');
  }, [isOpen, currentMobile, isChangeMode]);

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

    const cleaned = mobileNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/phone/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setMaskedPhone(data.maskedPhone || mobileNumber);
      if (data.debugOtp) setDebugOtp(data.debugOtp);

      showToast(data.message || `✓ OTP sent to ${data.maskedPhone || mobileNumber}`, 'info', 'OTP Sent');
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
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/user/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');

      showToast(data.message || '✓ Mobile number verified successfully', 'success', 'Phone Verified');
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
      title={isChangeMode ? 'Change Mobile Number' : 'Register Mobile Number'}
    >
      {step === 'INPUT_PHONE' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-1.5 text-xs text-purple-950">
            <div className="flex items-center gap-1.5 font-bold text-purple-900">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span>{isChangeMode ? 'Update Mobile Number' : 'Mobile Verification Required'}</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Enter your mobile number to receive a 6-digit OTP code for verification. Verified mobile numbers are required for account security and password changes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Mobile Number
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-3 bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl">
                +91
              </span>
              <Input
                type="tel"
                placeholder="9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                maxLength={10}
                required
                className="flex-1 text-sm font-semibold"
              />
            </div>
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
              Send OTP
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
              <span>Enter OTP sent to {maskedPhone}</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              We sent a 6-digit verification code to <strong>{maskedPhone}</strong>. OTP expires in 5 minutes.
            </p>
          </div>

          {debugOtp && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-mono text-amber-800 text-center">
              Dev Mode Helper — Your OTP: <strong>{debugOtp}</strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              6-Digit OTP Code
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
              onClick={() => setStep('INPUT_PHONE')}
              className="font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Change Mobile Number
            </button>

            {cooldown > 0 ? (
              <span className="text-[11px] font-bold text-slate-400">
                Resend OTP in {cooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestOtp}
                className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Resend OTP
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
              Verify OTP
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
