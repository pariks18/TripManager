'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ExpenseDetail, MemberBalance, SettlementRecordDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Wallet, Sparkles, History, ArrowDownLeft } from 'lucide-react';

interface AdvanceCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  currentUserId: string;
  memberBalance?: MemberBalance;
  settlementRecords?: SettlementRecordDetail[];
  expenses?: ExpenseDetail[];
}

export const AdvanceCreditModal: React.FC<AdvanceCreditModalProps> = ({
  isOpen,
  onClose,
  currency,
  currentUserId,
  memberBalance,
  settlementRecords = [],
  expenses = [],
}) => {
  const availableCredit = memberBalance?.advanceCredit || 0;

  // Confirmed settlements paid by current user that created advance credits
  const confirmedPaidSettlements = React.useMemo(() => {
    return settlementRecords.filter(
      (r) =>
        r.fromUserId === currentUserId &&
        (r.status === 'CONFIRMED' || r.status === 'SETTLED' || r.status === 'COMPLETED')
    );
  }, [settlementRecords, currentUserId]);

  const totalCreditAdded = React.useMemo(() => {
    return confirmedPaidSettlements.reduce((sum, r) => sum + r.amount, 0);
  }, [confirmedPaidSettlements]);

  // Credit used is total credit added minus current available credit
  const creditUsed = Math.max(0, Math.round((totalCreditAdded - availableCredit) * 100) / 100);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advance Credit 💰">
      <div className="space-y-5">
        {/* Available Credit Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              Available Credit
            </span>
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Wallet className="w-5 h-5 text-emerald-100" />
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

        {/* Metric Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Available Credit
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 block mt-0.5 truncate">
              {formatCurrency(availableCredit, currency)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Total Credit Added
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 block mt-0.5 truncate">
              {formatCurrency(totalCreditAdded, currency)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Credit Used
            </span>
            <span className="text-xs sm:text-sm font-bold text-purple-700 block mt-0.5 truncate">
              {formatCurrency(creditUsed, currency)}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5">
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Remaining Credit
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-600 block mt-0.5 truncate">
              {formatCurrency(availableCredit, currency)}
            </span>
          </div>
        </div>

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
            <History className="w-4 h-4 text-emerald-600" /> Advance History
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
                    +{formatCurrency(record.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
