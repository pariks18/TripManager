'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ExpenseDetail, MemberBalance, SettlementRecordDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Sparkles, History, ArrowDownLeft } from 'lucide-react';

interface AdvanceCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  currentUserId: string;
  tripId?: string;
  memberBalance?: MemberBalance;
  settlementRecords?: SettlementRecordDetail[];
  expenses?: ExpenseDetail[];
  onSuccess?: () => void;
}

export const AdvanceCreditModal: React.FC<AdvanceCreditModalProps> = ({
  isOpen,
  onClose,
  currency,
  currentUserId,
  tripId,
  memberBalance,
  settlementRecords = [],
  expenses = [],
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'add'>('overview');
  const [addAmount, setAddAmount] = React.useState('');
  const [addNote, setAddNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const availableCredit = memberBalance?.advanceCredit || 0;

  // Confirmed settlements paid by current user that created advance credits
  const confirmedPaidSettlements = React.useMemo(() => {
    return settlementRecords.filter(
      (r) =>
        r.fromUserId === currentUserId &&
        (r.status === 'CONFIRMED' || r.status === 'SETTLED' || r.status === 'COMPLETED')
    );
  }, [settlementRecords, currentUserId]);

  const pendingAdvanceCreditRequests = React.useMemo(() => {
    return settlementRecords.filter(
      (r) =>
        r.fromUserId === currentUserId &&
        r.status === 'PENDING' &&
        r.type === 'ADVANCE_CREDIT'
    );
  }, [settlementRecords, currentUserId]);

  const totalCreditAdded = React.useMemo(() => {
    return confirmedPaidSettlements.reduce((sum, r) => sum + r.amount, 0);
  }, [confirmedPaidSettlements]);

  // Credit used is total credit added minus current available credit
  const creditUsed = Math.max(0, Math.round((totalCreditAdded - availableCredit) * 100) / 100);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const parsed = parseFloat(addAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setErrorMsg('Please enter a positive amount greater than zero.');
      return;
    }

    if (!tripId) {
      setErrorMsg('Trip context missing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/advance-credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed,
          note: addNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit Advance Credit request');

      setSuccessMsg(`✓ Submitted ${formatCurrency(parsed, currency)} Advance Credit request for Host approval.`);
      setAddAmount('');
      setAddNote('');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit Advance Credit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advance Credit & Funds">
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 pb-1 gap-2 text-xs font-extrabold">
          <button
            onClick={() => { setActiveTab('overview'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2 px-3 transition-colors ${
              activeTab === 'overview'
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Overview & History
          </button>
          <button
            onClick={() => { setActiveTab('add'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`pb-2 px-3 transition-colors ${
              activeTab === 'add'
                ? 'border-b-2 border-emerald-600 text-emerald-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            + Add Advance Credit
          </button>
        </div>

        {activeTab === 'add' ? (
          <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800">
                {successMsg}
              </div>
            )}

            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
              <span className="text-xs font-bold text-emerald-900 block">
                Add Your Own Advance Credit
              </span>
              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                Advance Credit is money contributed before or independently of trip expenses. Once approved by the Host, it auto-adjusts your future expense shares.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Credit Amount ({currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 7000"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xl font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                Note / Purpose (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Advance fund for cabs/hotels"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs font-medium rounded-2xl p-3 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 text-xs font-extrabold py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Host Approval'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Available Credit Banner */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                  Available Credit
                </span>
                <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="w-5 h-5 text-emerald-100" />
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-black tracking-tight">
                  💰 {formatCurrency(availableCredit, currency)}
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium mt-1">
                  Advance credit available to auto-absorb future trip expense shares.
                </p>
              </div>
            </div>

            {/* 3 Metric Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Available
                </span>
                <span className="text-sm font-black text-emerald-700 block mt-0.5">
                  {formatCurrency(availableCredit, currency)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Added
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {formatCurrency(totalCreditAdded, currency)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Credit Used
                </span>
                <span className="text-sm font-bold text-purple-700 block mt-0.5">
                  {formatCurrency(creditUsed, currency)}
                </span>
              </div>
            </div>

            {/* Pending Requests Banner */}
            {pendingAdvanceCreditRequests.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1 text-xs">
                <span className="font-extrabold text-amber-900 block">
                  Pending Host Approval ({pendingAdvanceCreditRequests.length})
                </span>
                {pendingAdvanceCreditRequests.map((r) => (
                  <div key={r.id} className="flex justify-between items-center text-amber-800 font-medium">
                    <span>{r.note || 'Advance Credit Request'}</span>
                    <span className="font-bold">{formatCurrency(r.amount, currency)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                Advance Credit represents excess money paid beyond your trip expenses. It automatically adjusts future expense shares so you pay less in upcoming settlements.
              </p>
            </div>

            {/* Credit History Timeline */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <History className="w-4 h-4 text-emerald-600" /> Credit & Payment History
              </div>

              {confirmedPaidSettlements.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-400">No advance credit payments recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {confirmedPaidSettlements.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                          <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">
                            Payment to {record.toUser.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(record.createdAt)}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-black text-emerald-700">
                        {formatCurrency(record.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
