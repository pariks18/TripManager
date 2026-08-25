'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SettlementTransaction, TripMemberDetail, UserSummary, UserWalletDetail } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, Wallet, AlertCircle, CreditCard, Edit3 } from 'lucide-react';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  transaction: SettlementTransaction | null;
  members?: TripMemberDetail[];
  myWallet?: UserWalletDetail | null;
  allWallets?: UserWalletDetail[];
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
  myWallet,
  allWallets = [],
  currentUserId,
  isAdmin = false,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isEditingAmount, setIsEditingAmount] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'PERSONAL' | 'WALLET'>('PERSONAL');
  const [note, setNote] = useState<string>('');
  const [selectedFromUserId, setSelectedFromUserId] = useState<string>('');
  const [selectedToUserId, setSelectedToUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<{
    paidAmount: number;
    method: 'PERSONAL' | 'WALLET';
    remainingWallet: number;
    status: string;
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

  // Determine payer's wallet balance
  const activeDebtorUserId = fromUser?.id || currentUserId;
  const debtorWallet =
    allWallets.find((w) => w.userId === activeDebtorUserId) ||
    (activeDebtorUserId === currentUserId ? myWallet : null);
  const payerWalletBalance = debtorWallet?.balance || 0;

  useEffect(() => {
    if (transaction) {
      setCustomAmount(transaction.amount.toString());
      setIsEditingAmount(false);
      setNote('');
      setError('');
      setSuccessResult(null);
      setSelectedFromUserId(transaction.fromUser.id);
      setSelectedToUserId(transaction.toUser.id);

      const dWallet = allWallets.find((w) => w.userId === transaction.fromUser.id) || myWallet;
      if (dWallet && dWallet.balance >= transaction.amount) {
        setPaymentMethod('WALLET');
      } else {
        setPaymentMethod('PERSONAL');
      }
    } else if (members.length >= 2) {
      setSelectedFromUserId(currentUserId);
      const firstOther = members.find((m) => m.userId !== currentUserId);
      if (firstOther) setSelectedToUserId(firstOther.userId);
      setCustomAmount('');
      setIsEditingAmount(true);
      setNote('');
      setError('');
      setSuccessResult(null);
      setPaymentMethod('PERSONAL');
    }
  }, [transaction, isOpen, currentUserId, members, myWallet, allWallets]);

  const numCustomAmount = parseFloat(customAmount);
  const amountToSettle = isNaN(numCustomAmount) ? 0 : Math.round(numCustomAmount * 100) / 100;

  const isWalletInsufficient = paymentMethod === 'WALLET' && payerWalletBalance < amountToSettle - 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountToSettle <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }

    if (isWalletInsufficient) {
      setError(`Not enough wallet balance (${formatCurrency(payerWalletBalance, currency)}). Please use Personal Money.`);
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
          paymentMethod,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process settlement payment');

      const isWallet = paymentMethod === 'WALLET';
      const remainingWallet = isWallet ? Math.max(0, payerWalletBalance - amountToSettle) : payerWalletBalance;
      const statusLabel = isWallet ? 'Completed' : 'Pending Host Approval';

      setSuccessResult({
        paidAmount: amountToSettle,
        method: paymentMethod,
        remainingWallet,
        status: statusLabel,
        toUserName: toUser.name,
        fromUserName: fromUser.id === currentUserId ? 'You' : fromUser.name,
      });

      showToast(
        isWallet
          ? `✓ Settlement Completed: Paid ${formatCurrency(amountToSettle, currency)} to ${toUser.name}`
          : `✓ Sent ${formatCurrency(amountToSettle, currency)} to ${toUser.name} for approval`,
        'success'
      );

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
    <Modal isOpen={isOpen} onClose={handleDoneSuccess} title="Settle Up">
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
              Paid to <span className="text-slate-900 font-bold">{successResult.toUserName}</span>
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

          {/* Simple Debt Summary Headline */}
          {fromUser && toUser && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center gap-3">
              <Avatar name={toUser.name} size="md" />
              <div>
                <span className="text-xs text-slate-500 font-medium block">Debt Settlement</span>
                <h4 className="text-base font-extrabold text-slate-900">
                  {fromUser.id === currentUserId ? 'You owe' : `${fromUser.name} owes`}{' '}
                  <span className="text-emerald-700">{formatCurrency(outstandingAmount || amountToSettle, currency)}</span> to{' '}
                  <span className="text-slate-900">{toUser.id === currentUserId ? 'You' : toUser.name}</span>
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

          {/* Simple Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('PERSONAL')}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all text-left ${
                  paymentMethod === 'PERSONAL'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Personal Money</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">UPI / Cash / Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('WALLET')}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all text-left ${
                  paymentMethod === 'WALLET'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Wallet</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Balance: {formatCurrency(payerWalletBalance, currency)}
                </span>
              </button>
            </div>
          </div>

          {/* Clean Insufficient Wallet Notice */}
          {isWalletInsufficient && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold">Wallet balance: {formatCurrency(payerWalletBalance, currency)}</p>
              <p className="text-amber-800">
                Not enough wallet balance. Please use <span className="font-bold">Personal Money</span>.
              </p>
            </div>
          )}

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
              disabled={isWalletInsufficient}
              className="flex-1 text-xs font-bold py-3"
            >
              Confirm Payment
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
