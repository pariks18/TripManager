'use client';

import React, { useState } from 'react';
import { CategoryType, TripMemberDetail } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  X,
  AlertCircle,
  Check,
  CheckSquare,
  Square,
  Hotel,
  Bus,
  Ticket,
  Utensils,
  Sparkles,
} from 'lucide-react';

interface SpendWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  availableBalance: number;
  members: TripMemberDetail[];
  onSuccess: () => void;
}

export const SpendWalletModal: React.FC<SpendWalletModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  availableBalance,
  members,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Stay');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    members.map((m) => m.userId)
  );
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: { label: CategoryType; icon: any }[] = [
    { label: 'Stay', icon: Hotel },
    { label: 'Travel', icon: Bus },
    { label: 'Entertainment', icon: Ticket },
    { label: 'Food', icon: Utensils },
    { label: 'Miscellaneous', icon: Sparkles },
  ];

  const toggleUser = (uid: string) => {
    if (selectedUserIds.includes(uid)) {
      if (selectedUserIds.length === 1) return; // Must have at least 1
      setSelectedUserIds(selectedUserIds.filter((id) => id !== uid));
    } else {
      setSelectedUserIds([...selectedUserIds, uid]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === members.length) {
      setSelectedUserIds([members[0].userId]);
    } else {
      setSelectedUserIds(members.map((m) => m.userId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid spending amount.');
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMsg(
        `Amount exceeds available Trip Wallet balance (${formatCurrency(availableBalance, currency)}).`
      );
      return;
    }

    if (!selectedUserIds.length) {
      setErrorMsg('Please select at least one member to split this wallet spending.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: numericAmount,
          category,
          participantUserIds: selectedUserIds,
          receiptUrl: receiptUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to log wallet spending');

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute wallet spending');
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
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Spend from Trip Wallet</h3>
              <p className="text-xs text-slate-400">Advance Bookings & Group Expenses</p>
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

          {/* Available Wallet Balance Card */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block">
                Available Wallet Balance
              </span>
              <span className="text-xl font-extrabold text-white mt-0.5 block">
                {formatCurrency(availableBalance, currency)}
              </span>
            </div>
            <span className="bg-white/10 text-indigo-200 border border-white/20 text-xs font-bold px-3 py-1 rounded-full">
              Advance Pool
            </span>
          </div>

          {/* Spending Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Booking / Expense Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Resort Booking Advance, Train Tickets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Spending Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Amount ({currency}) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                required
                max={availableBalance}
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-base rounded-2xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = category === cat.label;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setCategory(cat.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participants Checkbox List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Split Cost Between ({selectedUserIds.length} Selected)
              </label>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                {selectedUserIds.length === members.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              {members.map((m) => {
                const isSelected = selectedUserIds.includes(m.userId);
                return (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => toggleUser(m.userId)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                      isSelected
                        ? 'bg-white border border-indigo-200 text-indigo-900 shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{m.user.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt URL / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt URL / Booking Voucher Link <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl px-4 py-2 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex gap-3">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Wallet Spend'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
