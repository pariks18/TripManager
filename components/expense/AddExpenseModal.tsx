'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CategoryType, ExpenseDetail, TripMemberDetail } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import {
  Upload,
  X,
  Check,
  Users,
  Sparkles,
  AlertCircle,
  ShieldAlert,
  CreditCard,
  Receipt,
  Camera,
  Image as ImageIcon,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  members: TripMemberDetail[];
  currentUserId: string;
  isAdmin?: boolean;
  approvalMode?: boolean;
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
  approvalMode = false,
  existingExpense,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('Food');
  const [paidById, setPaidById] = useState(currentUserId);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const isRejected = existingExpense?.status === 'REJECTED';
  const isCreatorAdmin = isAdmin;
  const isEditRequestRequired = approvalMode && existingExpense && existingExpense.status === 'APPROVED' && !isCreatorAdmin;

  const [selectedPayerIds, setSelectedPayerIds] = useState<string[]>([currentUserId]);
  const [payerAmounts, setPayerAmounts] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    if (existingExpense) {
      setTitle(existingExpense.title);
      setAmount(existingExpense.amount.toString());
      setCategory(existingExpense.category);
      setPaidById(existingExpense.paidById);
      setSplitBetween(existingExpense.participants.map((p) => p.userId));
      setReceiptUrl(existingExpense.receiptUrl || null);

      if (existingExpense.payers && existingExpense.payers.length > 1) {
        setSelectedPayerIds(existingExpense.payers.map((p) => p.userId));
        const amountsMap: { [userId: string]: string } = {};
        existingExpense.payers.forEach((p) => {
          amountsMap[p.userId] = p.amount.toString();
        });
        setPayerAmounts(amountsMap);
      } else {
        setSelectedPayerIds([existingExpense.paidById]);
        setPayerAmounts({ [existingExpense.paidById]: existingExpense.amount.toString() });
      }
    } else {
      setTitle('');
      setAmount('');
      setCategory('Food');
      setPaidById(currentUserId);
      setSelectedPayerIds([currentUserId]);
      setPayerAmounts({ [currentUserId]: '' });
      setSplitBetween(members.map((m) => m.userId));
      setReceiptUrl(null);
    }
    setError('');
  }, [existingExpense, isOpen, currentUserId, members]);

  const togglePayer = (userId: string, isMultiMode: boolean = false) => {
    if (!isMultiMode) {
      // Single Payer Selection: Set exactly 1 payer
      setSelectedPayerIds([userId]);
      setPaidById(userId);
      setPayerAmounts({ [userId]: amount });
      return;
    }

    // Multiple Payers Toggle
    if (selectedPayerIds.includes(userId)) {
      if (selectedPayerIds.length === 1) return;
      const nextPayerIds = selectedPayerIds.filter((id) => id !== userId);
      setSelectedPayerIds(nextPayerIds);
      if (nextPayerIds.length === 1) {
        setPaidById(nextPayerIds[0]);
      }
    } else {
      const nextPayerIds = [...selectedPayerIds, userId];
      setSelectedPayerIds(nextPayerIds);
      const numAmt = parseFloat(amount);
      if (!isNaN(numAmt) && numAmt > 0) {
        const equalShare = (numAmt / nextPayerIds.length).toFixed(2);
        const newAmountsMap: { [key: string]: string } = {};
        nextPayerIds.forEach((id) => {
          newAmountsMap[id] = equalShare;
        });
        setPayerAmounts(newAmountsMap);
      }
    }
  };

  const autoDistributePayerAmounts = () => {
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0 || selectedPayerIds.length === 0) return;
    const equalShare = (numAmt / selectedPayerIds.length).toFixed(2);
    const newAmountsMap: { [key: string]: string } = {};
    selectedPayerIds.forEach((id) => {
      newAmountsMap[id] = equalShare;
    });
    setPayerAmounts(newAmountsMap);
  };

  const isMultiPayer = selectedPayerIds.length >= 2;

  const totalPayerAmount = isMultiPayer
    ? selectedPayerIds.reduce((sum, uid) => {
        const val = parseFloat(payerAmounts[uid] || '0');
        return sum + (isNaN(val) ? 0 : val);
      }, 0)
    : parseFloat(amount) || 0;

  const roundedTotalPayerAmount = Math.round(totalPayerAmount * 100) / 100;
  const numExpenseAmount = parseFloat(amount) || 0;
  const isPayerSumValid = !isMultiPayer || Math.abs(roundedTotalPayerAmount - numExpenseAmount) < 0.01;

  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Receipt image size should be less than 10MB');
      return;
    }

    setIsUploadingReceipt(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'receipts' }),
        });
        const data = await res.json();
        if (res.ok && data.secureUrl) {
          setReceiptUrl(data.secureUrl);
        } else {
          setError(data.error || 'Failed to upload receipt to Cloudinary');
        }
      } catch (err: any) {
        setError('Error uploading receipt image');
      } finally {
        setIsUploadingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleParticipant = (userId: string) => {
    if (splitBetween.includes(userId)) {
      if (splitBetween.length === 1) return;
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
    if (splitBetween.length === 0) {
      setError('Select at least one member to split with');
      return;
    }

    if (isMultiPayer) {
      if (!isPayerSumValid) {
        const diff = Math.round(Math.abs(roundedTotalPayerAmount - numAmount) * 100) / 100;
        setError(
          `The sum of individual amounts paid (${formatCurrency(roundedTotalPayerAmount, currency)}) must equal the total expense amount (${formatCurrency(numAmount, currency)}). Difference: ${formatCurrency(diff, currency)}.`
        );
        return;
      }
    }

    setIsLoading(true);
    setError('');

    const primaryPaidById = selectedPayerIds[0] || paidById;
    const payersPayload = isMultiPayer
      ? selectedPayerIds.map((uid) => ({
          userId: uid,
          amount: parseFloat(payerAmounts[uid]) || 0,
        }))
      : [{ userId: primaryPaidById, amount: numAmount }];

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
              paidById: primaryPaidById,
              participantUserIds: splitBetween,
              receiptUrl,
              payers: payersPayload,
            },
            reason: 'User proposed expense updates',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit edit request');
        showToast('✓ Edit request submitted successfully! Waiting for host approval.', 'info', 'Request Submitted');
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
          paidById: primaryPaidById,
          participantUserIds: splitBetween,
          receiptUrl,
          payers: payersPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save expense');

      showToast(
        `✓ Expense "${title.trim()}" (${formatCurrency(numAmount, currency)}) ${existingExpense ? 'updated' : 'added'} successfully`,
        'success',
        existingExpense ? 'Expense Updated' : 'Expense Added'
      );

      onSuccess(data.expense);
      onClose();
    } catch (err: any) {
      setError(err.message);
      showToast(err.message || 'Failed to save expense', 'error', 'Error');
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
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
            Expense Title
          </label>
          <Input
            placeholder="e.g. Seafood Dinner, Taxi Ride"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
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
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xl font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            required
          />
        </div>

        {/* Payer Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Paid By
            </label>
            <button
              type="button"
              onClick={() => {
                if (isMultiPayer) {
                  // Switch back to single payer (current user)
                  setSelectedPayerIds([currentUserId]);
                  setPaidById(currentUserId);
                  setPayerAmounts({ [currentUserId]: amount });
                } else {
                  // Enable multi-payer mode (select all or first 2)
                  const defaultPayers = members.slice(0, 2).map((m) => m.userId);
                  setSelectedPayerIds(defaultPayers);
                  const numAmt = parseFloat(amount);
                  if (!isNaN(numAmt) && numAmt > 0) {
                    const share = (numAmt / defaultPayers.length).toFixed(2);
                    const map: { [key: string]: string } = {};
                    defaultPayers.forEach((id) => (map[id] = share));
                    setPayerAmounts(map);
                  }
                }
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              {isMultiPayer ? 'Single Payer Mode' : '+ Multiple Payers'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => {
              const isSelected = selectedPayerIds.includes(m.userId);
              return (
                <button
                  type="button"
                  key={m.userId}
                  onClick={() => togglePayer(m.userId, isMultiPayer)}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Avatar name={m.user.name} size="sm" />
                  <span className="truncate">{m.user.name} {m.userId === currentUserId ? '(You)' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Amount Paid Section for Multiple Payers */}
        {isMultiPayer && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Amount Paid ({selectedPayerIds.length} Payers)
              </label>
              <button
                type="button"
                onClick={autoDistributePayerAmounts}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
              >
                Equal Split
              </button>
            </div>

            <div className="space-y-2">
              {selectedPayerIds.map((uid) => {
                const memberObj = members.find((m) => m.userId === uid);
                if (!memberObj) return null;
                return (
                  <div key={uid} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={memberObj.user.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {memberObj.user.name} {uid === currentUserId ? '(You)' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs font-semibold text-slate-400">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={payerAmounts[uid] || ''}
                        onChange={(e) => {
                          setPayerAmounts({
                            ...payerAmounts,
                            [uid]: e.target.value,
                          });
                          setError('');
                        }}
                        className="w-28 bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-emerald-500 focus:bg-white text-right"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sum Live Status */}
            <div className="pt-1 flex items-center justify-between text-xs font-semibold border-t border-slate-200/80">
              <span className="text-slate-500">Total Amounts Paid:</span>
              <span className={`font-mono font-bold ${isPayerSumValid ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(roundedTotalPayerAmount, currency)} / {formatCurrency(numExpenseAmount, currency)}
              </span>
            </div>

            {!isPayerSumValid && numExpenseAmount > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Sum of amounts paid ({formatCurrency(roundedTotalPayerAmount, currency)}) must equal total expense amount ({formatCurrency(numExpenseAmount, currency)}).
                </span>
              </div>
            )}
          </div>
        )}

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
