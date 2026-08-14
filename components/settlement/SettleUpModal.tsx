'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SettlementTransaction, TripMemberDetail, UserSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, CheckCircle2, DollarSign, Info, ShieldCheck, Sparkles, Wallet, AlertCircle } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  transaction: SettlementTransaction | null;
  members?: TripMemberDetail[];
  currentUserId: string;
  isAdmin?: boolean;
  onSuccess: () => void;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  transaction,
  members = [],
  currentUserId,
  isAdmin = false,
  onSuccess,
}) => {
  const [settlementMode, setSettlementMode] = useState<'FULL' | 'CUSTOM'>('FULL');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedFromUserId, setSelectedFromUserId] = useState<string>('');
  const [selectedToUserId, setSelectedToUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine active transaction details
  const fromUser: UserSummary | undefined = transaction
    ? transaction.fromUser
    : members.find((m) => m.userId === selectedFromUserId)?.user;
  const toUser: UserSummary | undefined = transaction
    ? transaction.toUser
    : members.find((m) => m.userId === selectedToUserId)?.user;

  const outstandingAmount = transaction ? transaction.amount : 0;

  useEffect(() => {
    if (transaction) {
      setSettlementMode('FULL');
      setCustomAmount(transaction.amount.toString());
      setNote('');
      setError('');
      setSelectedFromUserId(transaction.fromUser.id);
      setSelectedToUserId(transaction.toUser.id);
    } else if (members.length >= 2) {
      setSelectedFromUserId(currentUserId);
      const firstOther = members.find((m) => m.userId !== currentUserId);
      if (firstOther) setSelectedToUserId(firstOther.userId);
      setSettlementMode('CUSTOM');
      setCustomAmount('');
      setNote('');
      setError('');
    }
  }, [transaction, isOpen, currentUserId, members]);

  const numCustomAmount = parseFloat(customAmount);
  const amountToSettle = settlementMode === 'FULL' ? outstandingAmount : isNaN(numCustomAmount) ? 0 : numCustomAmount;
  
  const isOverpaying = outstandingAmount > 0 && amountToSettle > outstandingAmount + 0.01;

  const isDebtor = fromUser?.id === currentUserId;
  const isCreditor = toUser?.id === currentUserId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountToSettle <= 0) {
      setError('Please enter a valid settlement amount greater than zero.');
      return;
    }

    if (isOverpaying) {
      setError(
        `Settlement amount (${formatCurrency(amountToSettle, currency)}) cannot exceed currently outstanding debt (${formatCurrency(outstandingAmount, currency)}). To contribute advance funds to the group, please use the Group Wallet tab.`
      );
      return;
    }

    if (!fromUser || !toUser) {
      setError('Please select both payer and recipient for this settlement.');
      return;
    }

    if (fromUser.id === toUser.id) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          amount: amountToSettle,
          status: 'PENDING',
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit settlement request');

      alert(
        `Settlement request of ${formatCurrency(amountToSettle, currency)} sent successfully! Waiting for recipient approval.`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Up / Advance Payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Transfer Header Card */}
        {fromUser && toUser && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              {/* From User */}
              <div className="flex items-center gap-2">
                <Avatar name={fromUser.name} size="sm" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    {fromUser.id === currentUserId ? 'You' : fromUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500">Payer</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center px-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-1">pays</span>
              </div>

              {/* To User */}
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block text-right">
                    {toUser.id === currentUserId ? 'You' : toUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 block text-right">Recipient</span>
                </div>
                <Avatar name={toUser.name} size="sm" />
              </div>
            </div>

            {outstandingAmount > 0 && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Current Outstanding Balance:</span>
                <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  {formatCurrency(outstandingAmount, currency)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Settlement Type Selector */}
        {outstandingAmount > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Settlement Option
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSettlementMode('FULL');
                  setCustomAmount(outstandingAmount.toString());
                  setError('');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                  settlementMode === 'FULL'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span>Full Amount</span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {formatCurrency(outstandingAmount, currency)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSettlementMode('CUSTOM');
                  setCustomAmount('');
                  setError('');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs transition-all ${
                  settlementMode === 'CUSTOM'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                }`}
              >
                <span>Custom Amount</span>
                <span className="text-xs font-semibold text-purple-700">Specify Amount</span>
              </button>
            </div>
          </div>
        )}

        {/* Custom Amount Input Field */}
        {(settlementMode === 'CUSTOM' || outstandingAmount === 0) && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Amount Being Settled / Paid ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>
          </div>
        )}

        {/* Breakdown Transparency Card */}
        {outstandingAmount > 0 && amountToSettle > 0 && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Required Share / Outstanding:</span>
              <span className="font-bold text-slate-900">{formatCurrency(outstandingAmount, currency)}</span>
            </div>
            <div className="flex justify-between items-center text-emerald-800">
              <span className="font-semibold">Amount Being Settled:</span>
              <span className="font-extrabold text-emerald-700">
                {formatCurrency(amountToSettle, currency)}
              </span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Remaining Balance After Approval:</span>
              <span
                className={`font-mono font-extrabold px-2 py-0.5 rounded-lg ${
                  Math.max(0, outstandingAmount - amountToSettle) === 0
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {formatCurrency(Math.max(0, Math.round((outstandingAmount - amountToSettle) * 100) / 100), currency)}
              </span>
            </div>
          </div>
        )}

        {/* Note / Preset Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            Payment Note / Description (Optional)
          </label>
          <Input
            placeholder="e.g. Paid via GPay, Cash, UPI Ref"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button
              type="button"
              onClick={() => setNote('Full settlement paid via GPay')}
              className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl transition-colors"
            >
              Full Settlement GPay
            </button>
            <button
              type="button"
              onClick={() => setNote('Partial payment via UPI')}
              className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl transition-colors"
            >
              Partial payment via UPI
            </button>
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
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex-1 text-xs font-bold py-3"
          >
            Request Settlement ({formatCurrency(amountToSettle, currency)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};
