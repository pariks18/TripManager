'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'EMAIL' | 'MOBILE';
  targetValue: string;
  onVerified: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetValue,
  onVerified,
}) => {
  const [otpCode, setOtpCode] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentSuccess, setSentSuccess] = useState(true);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.trim().length < 4) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onVerified();
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Verify ${targetType === 'EMAIL' ? 'Email Address' : 'Mobile Number'}`}
    >
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
            A 6-digit verification code has been sent to <strong>{targetValue}</strong>. Enter code below to confirm this change.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            6-Digit Verification Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-center tracking-widest text-xl font-mono font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              required
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-center">
            Demo helper: Use code <strong>123456</strong> to verify immediately
          </p>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1 text-xs font-bold py-3">
            Confirm & Save
          </Button>
        </div>
      </form>
    </Modal>
  );
};
