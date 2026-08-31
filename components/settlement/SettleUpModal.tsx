'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SettlementTransaction, TripMemberDetail, UserSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

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
  const { showToast } = useToast();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isEditingAmount, setIsEditingAmount] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [selectedFromUserId, setSelectedFromUserId] = useState<string>('');
  const [selectedToUserId, setSelectedToUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{
    paidAmount: number;
    toUserName: string;
    fromUserName: string;
  } | null>(null);

  // Determine active transaction details dynamically from real data
  const fromUser: UserSummary | undefined = transaction
    ? transaction.fromUser
    : members.find((m) => m.userId === selectedFromUserId)?.user;
  const toUser: UserSummary | undefined = transaction
    ? transaction.toUser
    : members.find((m) => m.userId === selectedToUserId)?.user;

  const outstandingAmount = transaction ? transaction.amount : 0;

  // Determine if this is a Host recording payment received on behalf of a member
  const isHostRecord = isAdmin && !!fromUser && fromUser.id !== currentUserId;

  useEffect(() => {
    if (transaction) {
      setCustomAmount(transaction.amount.toString());
      setIsEditingAmount(false);
      setNote('');
      setError('');
      setSuccessResult(null);
      setSelectedFromUserId(transaction.fromUser.id);
      setSelectedToUserId(transaction.toUser.id);
    } else if (members.length >= 2) {
      const firstOther = members.find((m) => m.userId !== currentUserId);
      if (isAdmin && firstOther) {
        setSelectedFromUserId(firstOther.userId);
        setSelectedToUserId(currentUserId);
      } else {
        setSelectedFromUserId(currentUserId);
        if (firstOther) setSelectedToUserId(firstOther.userId);
      }
      setCustomAmount('');
      setIsEditingAmount(true);
      setNote('');
      setError('');
      setSuccessResult(null);
    }
  }, [transaction, isOpen, currentUserId, members, isAdmin]);

  const numCustomAmount = parseFloat(customAmount);
  const amountToSettle = isNaN(numCustomAmount) ? 0 : Math.round(numCustomAmount * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountToSettle <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }

    if (!fromUser || !toUser) {
      setError('Please select both payer and recipient.');
      return;
    }

    if (fromUser.id === toUser.id) {
      setError('Payer and recipient cannot be the same person.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          paymentAmount: amountToSettle,
          note: note.trim() || undefined,
          isHostRecord,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process settlement payment');

      setSuccessResult({
        paidAmount: amountToSettle,
        toUserName: toUser.name,
        fromUserName: fromUser.id === currentUserId ? 'You' : fromUser.name,
      });

      if (isHostRecord) {
        showToast(
          `✓ Recorded ${formatCurrency(amountToSettle, currency)} payment received from ${fromUser.name}`,
          'success'
        );
      } else {
        showToast(
          `✓ Sent ${formatCurrency(amountToSettle, currency)} to ${toUser.name} for approval`,
          'success'
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process settlement payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoneSuccess = () => {
    setSuccessResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDoneSuccess}
      title={isHostRecord ? 'Record Payment Received' : 'Settle Up'}
    >
      {successResult ? (
        <div className="space-y-4 py-2 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">
              {formatCurrency(successResult.paidAmount, currency)}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              {isHostRecord ? (
                <>
                  Recorded payment received from{' '}
                  <span className="text-slate-900 font-bold">{successResult.fromUserName}</span>
                </>
              ) : (
                <>
                  Sent to <span className="text-slate-900 font-bold">{successResult.toUserName}</span> for approval
                </>
              )}
            </p>
          </div>

          <Button onClick={handleDoneSuccess} className="w-full font-bold py-3 text-xs">
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Dynamic Member Dropdowns when creating payment without preselected transaction */}
          {!transaction && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Payer (Who Paid?)
                </label>
                <select
                  value={selectedFromUserId}
                  onChange={(e) => setSelectedFromUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userId === currentUserId ? 'You (Host)' : m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Recipient (Who Received?)
                </label>
                <select
                  value={selectedToUserId}
                  onChange={(e) => setSelectedToUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userId === currentUserId ? 'You (Host)' : m.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Simple Debt Summary Headline */}
          {fromUser && toUser && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
              <Avatar name={isHostRecord ? fromUser.name : toUser.name} size="md" />
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  {isHostRecord ? 'Host Manual Record' : 'Debt Settlement'}
                </span>
                <h4 className="text-base font-extrabold text-slate-900">
                  {isHostRecord ? (
                    <>
                      Record payment received from{' '}
                      <span className="text-slate-900 font-bold">{fromUser.name}</span>
                      {outstandingAmount > 0 && (
                        <>
                          {' '}(owes{' '}
                          <span className="text-emerald-700">{formatCurrency(outstandingAmount, currency)}</span>)
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {fromUser.id === currentUserId ? 'You owe' : `${fromUser.name} owes`}{' '}
                      <span className="text-emerald-700">{formatCurrency(outstandingAmount || amountToSettle, currency)}</span> to{' '}
                      <span className="text-slate-900">{toUser.id === currentUserId ? 'You' : toUser.name}</span>
                    </>
                  )}
                </h4>
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Amount
              </label>
              {outstandingAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditingAmount(!isEditingAmount)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  {isEditingAmount ? 'Reset to Full' : 'Change Amount'}
                </button>
              )}
            </div>

            {isEditingAmount || outstandingAmount === 0 ? (
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xl font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                required
              />
            ) : (
              <div className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xl font-extrabold rounded-2xl p-3 flex justify-between items-center">
                <span>{formatCurrency(amountToSettle, currency)}</span>
                <span className="text-xs font-medium text-slate-400">Full Amount</span>
              </div>
            )}
          </div>

          {/* Payment Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
              Note (Optional)
            </label>
            <Input
              placeholder="e.g. Paid via GPay, Cash"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Confirm Button */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1 text-xs font-bold py-3 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isHostRecord ? 'Record Payment Received' : 'Confirm Payment'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
