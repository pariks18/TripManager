'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryType, ExpenseDetail, TripMemberDetail, UserSummary } from '@/types';
import { CATEGORY_CONFIG, formatCurrency } from '@/lib/utils';
import { Utensils, Plane, Fuel, Home, Ticket, ShoppingBag, Sparkles, Check, CheckSquare, Square } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  members: TripMemberDetail[];
  currentUserId: string;
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
  existingExpense,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingExpense) {
      setTitle(existingExpense.title);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setPaidById(existingExpense.paidById);
      setSplitBetween(existingExpense.participants.map((p) => p.userId));
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaidById(currentUserId);
      setSplitBetween(members.map((m) => m.userId));
    }
  }, [existingExpense, isOpen, members, currentUserId]);

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
      // Keep current user selected
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
    if (splitBetween.length === 0) {
      setError('Select at least one member to split with');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
          splitBetween,
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
      title={existingExpense ? 'Edit Expense' : 'Add New Expense'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
            {error}
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

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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
            {existingExpense ? 'Save Changes' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
