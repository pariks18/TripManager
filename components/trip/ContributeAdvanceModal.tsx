'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  X,
  FileCheck2,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface ContributeAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  requireVerification: boolean;
  onSuccess: () => void;
}

export const ContributeAdvanceModal: React.FC<ContributeAdvanceModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  requireVerification,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid contribution amount.');
      return;
    }

    if (requireVerification) {
      if (!utr.trim()) {
        setErrorMsg('UTR / Transaction ID is required when verification is enabled.');
        return;
      }
      if (!screenshotUrl.trim()) {
        setErrorMsg('Payment screenshot proof is required when verification is enabled.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/advance/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          utr: utr.trim(),
          screenshotUrl: screenshotUrl.trim(),
          note: note.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit advance contribution');

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-2xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Contribute Advance Payment</h3>
              <p className="text-xs text-slate-400">Trip Advance Fund Pool</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Verification Requirement Banner */}
          <div
            className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              requireVerification
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-blue-50/70 border-blue-200 text-blue-900'
            }`}
          >
            {requireVerification ? (
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-bold block">
                {requireVerification
                  ? 'Verification Mode Enabled'
                  : 'Verification Mode Disabled (Simple Payment)'}
              </span>
              <span className="text-[11px] block mt-0.5">
                {requireVerification
                  ? 'UTR / Transaction ID and payment screenshot are MANDATORY for Super Host verification.'
                  : 'Tap "I\'ve Paid" after sending money. Super Host approval is required.'}
              </span>
            </div>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contribution Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 2000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base rounded-2xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* UTR Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              UTR / Transaction Ref ID{' '}
              {requireVerification ? (
                <span className="text-rose-500 font-bold">* (Mandatory)</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional)</span>
              )}
            </label>
            <input
              type="text"
              required={requireVerification}
              placeholder="e.g. UPI/123456789012"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Screenshot Proof Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Screenshot URL / Proof{' '}
              {requireVerification ? (
                <span className="text-rose-500 font-bold">* (Mandatory)</span>
              ) : (
                <span className="text-slate-400 font-normal">(Optional)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="url"
                required={requireVerification}
                placeholder="e.g. https://images.unsplash.com/photo-..."
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {/* Quick Demo Upload Simulation Pills */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-slate-400">Quick Samples:</span>
              <button
                type="button"
                onClick={() => setScreenshotUrl('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop')}
                className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors"
              >
                Sample Receipt 1
              </button>
              <button
                type="button"
                onClick={() => setScreenshotUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop')}
                className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-colors"
              >
                Sample Receipt 2
              </button>
            </div>
          </div>

          {/* Note Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Note / Comments <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via GPay for advance trip fund"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex gap-3">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmitting
                ? 'Submitting...'
                : requireVerification
                ? 'Submit Payment for Verification'
                : "I've Paid"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
