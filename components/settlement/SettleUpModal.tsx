'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { SettlementTransaction, TripMemberDetail, UserSummary, UserWalletDetail } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { ArrowRight, CheckCircle2, Wallet, AlertCircle, CreditCard } from 'lucide-react';

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
  const [settlementMode, setSettlementMode] = useState<'FULL' | 'CUSTOM'>('FULL');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PERSONAL' | 'WALLET'>('WALLET');
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

  // Determine active transaction details
  const fromUser: UserSummary | undefined = transaction
    ? transaction.fromUser
    : members.find((m) => m.userId === selectedFromUserId)?.user;
  const toUser: UserSummary | undefined = transaction
    ? transaction.toUser
    : members.find((m) => m.userId === selectedToUserId)?.user;

  const outstandingAmount = transaction ? transaction.amount : 0;

  // Determine payer's personal wallet balance
  const activeDebtorUserId = fromUser?.id || currentUserId;
  const debtorWallet =
    allWallets.find((w) => w.userId === activeDebtorUserId) ||
    (activeDebtorUserId === currentUserId ? myWallet : null);
  const payerWalletBalance = debtorWallet?.balance || 0;

  useEffect(() => {
    if (transaction) {
      setSettlementMode('FULL');
      setCustomAmount(transaction.amount.toString());
      setNote('');
      setError('');
      setSuccessResult(null);
      setSelectedFromUserId(transaction.fromUser.id);
      setSelectedToUserId(transaction.toUser.id);

      // Auto-select WALLET if debtor has balance, else PERSONAL
      const dWallet = allWallets.find((w) => w.userId === transaction.fromUser.id) || myWallet;
      if (dWallet && dWallet.balance > 0) {
        setPaymentMethod('WALLET');
      } else {
        setPaymentMethod('PERSONAL');
      }
    } else if (members.length >= 2) {
      setSelectedFromUserId(currentUserId);
      const firstOther = members.find((m) => m.userId !== currentUserId);
      if (firstOther) setSelectedToUserId(firstOther.userId);
      setSettlementMode('CUSTOM');
      setCustomAmount('');
      setNote('');
      setError('');
      setSuccessResult(null);
      setPaymentMethod(myWallet && myWallet.balance > 0 ? 'WALLET' : 'PERSONAL');
    }
  }, [transaction, isOpen, currentUserId, members, myWallet, allWallets]);

  const numCustomAmount = parseFloat(customAmount);
  const rawAmountToSettle = settlementMode === 'FULL' ? outstandingAmount : isNaN(numCustomAmount) ? 0 : numCustomAmount;
  const amountToSettle = Math.round(rawAmountToSettle * 100) / 100;

  const isOverpaying = outstandingAmount > 0 && amountToSettle > outstandingAmount + 0.01;
  const isWalletInsufficient = paymentMethod === 'WALLET' && payerWalletBalance < amountToSettle - 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (amountToSettle <= 0) {
      setError('Please enter a valid settlement amount greater than zero.');
      return;
    }

    if (isOverpaying) {
      setError(
        `Settlement amount (${formatCurrency(amountToSettle, currency)}) cannot exceed currently outstanding debt (${formatCurrency(outstandingAmount, currency)}).`
      );
      return;
    }

    if (isWalletInsufficient) {
      setError(
        `Your personal advance wallet balance (${formatCurrency(payerWalletBalance, currency)}) is less than the settlement amount (${formatCurrency(amountToSettle, currency)}). Please select "Pay ${formatCurrency(payerWalletBalance, currency)} from Wallet" or switch to "Personal Money".`
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

      if (isWallet) {
        showToast(
          `✓ Settlement Completed: ${formatCurrency(amountToSettle, currency)} paid to ${toUser.name} from your Advance Wallet`,
          'success',
          'Settlement Completed'
        );
      } else {
        showToast(
          `✓ Settlement Request Sent: ${formatCurrency(amountToSettle, currency)} sent to ${toUser.name} for Host approval`,
          'info',
          'Request Sent'
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to process settlement payment');
      showToast(err.message || 'Failed to process settlement payment', 'error', 'Payment Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoneSuccess = () => {
    setSuccessResult(null);
    onClose();
  };

  const isWalletSuccess = successResult?.method === 'WALLET';

  return (
    <Modal isOpen={isOpen} onClose={handleDoneSuccess} title={successResult ? (isWalletSuccess ? 'Settlement Completed' : 'Settlement Request Sent') : 'Settle Up Debt'}>
      {successResult ? (
        <div className="space-y-4 py-2 text-center animate-fade-in">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md ${isWalletSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${isWalletSuccess ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isWalletSuccess ? '✓ Settlement Completed' : '✓ Request Sent'}
            </span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {formatCurrency(successResult.paidAmount, currency)}
            </h3>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              {isWalletSuccess ? (
                <>Paid to <span className="text-slate-900 font-bold">{successResult.toUserName}</span> from your Advance Wallet</>
              ) : (
                <>Sent to <span className="text-slate-900 font-bold">{successResult.toUserName}</span> for Host approval</>
              )}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2.5 text-left">
            <div className="flex justify-between items-center text-slate-600">
              <span>Payment Source:</span>
              <span className="font-bold text-slate-900">
                {isWalletSuccess
                  ? `${successResult.fromUserName}'s Advance Wallet`
                  : 'Personal Money'}
              </span>
            </div>

            {isWalletSuccess && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Wallet Remaining Balance:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {formatCurrency(successResult.remainingWallet, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200/60">
              <span>Status:</span>
              <span className={`font-extrabold px-2.5 py-0.5 rounded-full ${isWalletSuccess ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
                {isWalletSuccess ? 'Completed' : 'Pending Host Approval'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 italic pt-1">
              {isWalletSuccess
                ? '* Settlement completed instantly using your pre-approved Advance Wallet funds.'
                : '* Your request was sent — payment will complete once the Host approves.'}
            </p>
          </div>

          <Button onClick={handleDoneSuccess} className="w-full font-bold py-3 text-xs mt-2">
            Done
          </Button>
        </div>
      ) : (
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
                  <span className="text-slate-500 font-medium">Total Debt Owed:</span>
                  <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                    {formatCurrency(outstandingAmount, currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('WALLET');
                  setError('');
                }}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all text-left ${
                  paymentMethod === 'WALLET'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Wallet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Advance Wallet</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Available: {formatCurrency(payerWalletBalance, currency)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('PERSONAL');
                  setError('');
                }}
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
            </div>
          </div>

          {/* Insufficient Wallet Warning & Actions */}
          {isWalletInsufficient && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Your wallet does not have enough balance.</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Total debt owed is <span className="font-bold">{formatCurrency(amountToSettle, currency)}</span>, but your advance wallet has <span className="font-bold">{formatCurrency(payerWalletBalance, currency)}</span>.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                {payerWalletBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSettlementMode('CUSTOM');
                      setCustomAmount(payerWalletBalance.toString());
                      setError('');
                    }}
                    className="w-full py-2 px-3 bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 font-bold rounded-xl text-[11px] transition-colors text-left flex items-center justify-between"
                  >
                    <span>Pay {formatCurrency(payerWalletBalance, currency)} from Wallet</span>
                    <span className="text-[10px] text-amber-800 font-mono">(Remaining {formatCurrency(Math.max(0, outstandingAmount - payerWalletBalance), currency)} via Personal Money)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('PERSONAL');
                    setError('');
                  }}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-[11px] border border-amber-300 transition-colors text-left"
                >
                  Pay full {formatCurrency(amountToSettle, currency)} with Personal Money
                </button>
              </div>
            </div>
          )}

          {/* Custom Amount Option Selector */}
          {outstandingAmount > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Settlement Amount Option
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode('FULL');
                    setCustomAmount(outstandingAmount.toString());
                    setError('');
                  }}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    settlementMode === 'FULL'
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span>Full Amount</span>
                  <span className="font-extrabold">{formatCurrency(outstandingAmount, currency)}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSettlementMode('CUSTOM');
                    setCustomAmount('');
                    setError('');
                  }}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    settlementMode === 'CUSTOM'
                      ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <span>Partial Amount</span>
                  <span className="text-[11px]">Custom ₹</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Amount Input Field */}
          {(settlementMode === 'CUSTOM' || outstandingAmount === 0) && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Amount Being Paid ({currency})
              </label>
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
          )}

          {/* Breakdown Transparency Card */}
          {outstandingAmount > 0 && amountToSettle > 0 && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Debt Owed:</span>
                <span className="font-bold text-slate-900">{formatCurrency(outstandingAmount, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-800">
                <span className="font-semibold">Paying Now ({paymentMethod === 'WALLET' ? 'Advance Wallet' : 'Personal Money'}):</span>
                <span className="font-extrabold text-emerald-700">{formatCurrency(amountToSettle, currency)}</span>
              </div>

              {paymentMethod === 'WALLET' && (
                <div className="flex justify-between items-center text-slate-600">
                  <span>Wallet Balance (Before → After):</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {formatCurrency(payerWalletBalance, currency)} → {formatCurrency(Math.max(0, payerWalletBalance - amountToSettle), currency)}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Remaining Debt After Payment:</span>
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

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Payment Note (Optional)
            </label>
            <Input
              placeholder="e.g. Paid via GPay, Cash, Wallet Ref"
              value={note}
              onChange={(e) => setNote(e.target.value)}
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
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isWalletInsufficient}
              className="flex-1 text-xs font-bold py-3"
            >
              Pay {formatCurrency(amountToSettle, currency)}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

