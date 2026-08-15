'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryType, ExpenseDetail, TripMemberDetail, UserSummary, UserWalletDetail } from '@/types';
import { CATEGORY_CONFIG, formatCurrency } from '@/lib/utils';
import { Utensils, Plane, Fuel, Home, Ticket, ShoppingBag, Sparkles, Check, CheckSquare, Square, Camera, Image as ImageIcon, Trash2, Receipt, X } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  members: TripMemberDetail[];
  currentUserId: string;
  isAdmin?: boolean;
  walletBalance?: number;
  allWallets?: UserWalletDetail[];
  existingExpense?: ExpenseDetail | null;
  onSuccess: (expense: ExpenseDetail) => void;
}

const CATEGORIES: CategoryType[] = [
  'Food',
  'Travel',
  'Fuel',
  'Stay',
  'Entertainment',
  'Shopping',
  'Miscellaneous',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  members,
  currentUserId,
  isAdmin = false,
  walletBalance = 0,
  allWallets = [],
  existingExpense,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  const [paidById, setPaidById] = useState(currentUserId);
  const [paymentMode, setPaymentMode] = useState<'PERSONALLY' | 'WALLET'>('PERSONALLY');
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isRejected = existingExpense?.status === 'REJECTED';
  const isApproved = existingExpense?.status === 'APPROVED';
  const isEditRequestRequired = isApproved && !isAdmin;

  // Find the selected Payer's personal wallet balance
  const payerWallet = allWallets.find((w) => w.userId === paidById);
  const payerWalletBalance = payerWallet?.balance ?? walletBalance;
  const payerMember = members.find((m) => m.userId === paidById);
  const payerName = payerMember?.user.name || (paidById === currentUserId ? 'You' : 'Payer');

  useEffect(() => {
    if (existingExpense) {
      setTitle(existingExpense.title);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setPaidById(existingExpense.paidById);
      setPaymentMode(existingExpense.paymentMode || 'PERSONALLY');
      setSplitBetween(existingExpense.participants.map((p) => p.userId));
      setReceiptUrl(existingExpense.receiptUrl || null);
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaidById(currentUserId);
      setPaymentMode('PERSONALLY');
      setSplitBetween(members.map((m) => m.userId));
      setReceiptUrl(null);
    }
  }, [existingExpense, isOpen, members, currentUserId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Receipt photo must be smaller than 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleParticipant = (userId: string) => {
    if (splitBetween.includes(userId)) {
      if (splitBetween.length === 1) return; // Must have at least 1 split participant
      setSplitBetween(splitBetween.filter((id) => id !== userId));
    } else {
      setSplitBetween([...splitBetween, userId]);
    }
  };

  const toggleSelectAll = () => {
    if (splitBetween.length === members.length) {
      setSplitBetween([currentUserId]);
    } else {
      setSplitBetween(members.map((m) => m.userId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (paymentMode === 'WALLET' && numAmount > payerWalletBalance + 0.01) {
      setError(
        `Insufficient advance balance in ${paidById === currentUserId ? 'your' : `${payerName}'s`} personal wallet. Available: ${formatCurrency(payerWalletBalance, currency)}, required: ${formatCurrency(numAmount, currency)}.`
      );
      return;
    }
    if (splitBetween.length === 0) {
      setError('Select at least one member to split with');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isEditRequestRequired && existingExpense) {
        const res = await fetch(`/api/expenses/${existingExpense.id}/edit-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestType: 'EDIT',
            proposedData: {
              title: title.trim(),
              amount: numAmount,
              category,
              paidById,
              paymentMode,
              participantUserIds: splitBetween,
              receiptUrl,
            },
            reason: 'User proposed expense updates',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit edit request');
        alert('Edit request submitted successfully! Waiting for host approval.');
        onSuccess(existingExpense);
        onClose();
        return;
      }

      const url = existingExpense ? `/api/expenses/${existingExpense.id}` : '/api/expenses';
      const method = existingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          title: title.trim(),
          amount: numAmount,
          category,
          paidById,
          paymentMode,
          participantUserIds: splitBetween,
          receiptUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save expense');

      onSuccess(data.expense);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const perPersonShare =
    amount && !isNaN(parseFloat(amount)) && splitBetween.length > 0
      ? parseFloat(amount) / splitBetween.length
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingExpense ? (isEditRequestRequired ? 'Propose Expense Edit' : 'Edit Expense') : 'Add New Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {isEditRequestRequired && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 space-y-1">
            <p className="font-bold">Approval Mode Active</p>
            <p>Changes to approved expenses require host review before taking effect.</p>
          </div>
        )}

        <Input
          label="Expense Title"
          placeholder="e.g. Resort, Lunch, Fuel, Taxi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Paid By
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} {m.userId === currentUserId ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Amount ({currency})
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              required
            />
          </div>
        </div>

        {/* Payment Source Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            Payment Source
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMode('PERSONALLY')}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                paymentMode === 'PERSONALLY'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Personal Money</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('WALLET')}
              disabled={payerWalletBalance <= 0}
              className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                paymentMode === 'WALLET'
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                  : payerWalletBalance <= 0
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span>💳 Advance Wallet</span>
            </button>
          </div>
          {paymentMode === 'WALLET' ? (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {paidById === currentUserId ? 'Your' : `${payerName}'s`} Advance Wallet Balance: {formatCurrency(payerWalletBalance, currency)}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Advance balance available: {formatCurrency(payerWalletBalance, currency)}
            </p>
          )}
        </div>

        {/* Category Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expense Receipt Upload Section */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-600" /> Receipt Photo (Optional)
            </span>
            {receiptUrl && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Attached
              </span>
            )}
          </label>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {receiptUrl ? (
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex items-center gap-3">
              <img
                src={receiptUrl}
                alt="Receipt preview"
                className="w-16 h-16 object-cover rounded-xl border border-slate-200"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">Receipt Photo Attached</p>
                <p className="text-[11px] text-slate-500">Tap remove to upload a different photo</p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptUrl(null)}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                title="Remove photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-slate-100 hover:border-emerald-500 text-slate-700 text-xs font-bold transition-all"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-3 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-slate-100 hover:border-emerald-500 text-slate-700 text-xs font-bold transition-all"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Choose Gallery</span>
              </button>
            </div>
          )}
        </div>

        {/* Split Between Checkboxes */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Split Between ({splitBetween.length})
            </label>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {splitBetween.length === members.length ? 'Deselect Extra' : 'Select All'}
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {members.map((m) => {
              const isChecked = splitBetween.includes(m.userId);
              return (
                <div
                  key={m.userId}
                  onClick={() => toggleParticipant(m.userId)}
                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>
                      {m.user.name} {m.userId === currentUserId ? '(You)' : ''}
                    </span>
                  </div>
                  {isChecked && perPersonShare > 0 && (
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrency(perPersonShare, currency)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth isLoading={isLoading} size="lg">
            {isRejected
              ? 'Resubmit Expense for Approval'
              : isEditRequestRequired
              ? 'Submit Edit Request'
              : existingExpense
              ? 'Save Changes'
              : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
