'use client';

import React from 'react';
import { TripSummary, UserSession } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { computeSettlements, calculateMemberBalances } from '@/lib/settlement';
import { CheckCircle2, ArrowRight, Wallet, AlertCircle, Sparkles } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface FinalSettlementSummaryProps {
  trip: TripSummary;
  currentUser: UserSession;
  onSettleUp?: () => void;
}

export const FinalSettlementSummary: React.FC<FinalSettlementSummaryProps> = ({
  trip,
  currentUser,
  onSettleUp,
}) => {
  const memberBalances = calculateMemberBalances(
    trip.members,
    trip.expenses,
    trip.settlementRecords || []
  );

  const finalSettlements = computeSettlements(
    trip.members,
    trip.expenses,
    trip.settlementRecords || []
  );

  // Group balances into creditors and debtors
  const creditors = memberBalances.filter((m) => m.netBalance > 0.01);
  const debtors = memberBalances.filter((m) => m.netBalance < -0.01);
  const settled = memberBalances.filter((m) => Math.abs(m.netBalance) <= 0.01);

  const isHost =
    trip.createdById === currentUser.id ||
    trip.members.some((m) => m.userId === currentUser.id && m.role === 'ADMIN');

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-slate-50 border border-amber-200/80 rounded-3xl p-4 sm:p-6 space-y-6 shadow-sm">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Final Settlement Summary
              </h3>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                TRIP ENDED
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              This trip is completed. Review final settlement transactions and payouts below.
            </p>
          </div>
        </div>

        {onSettleUp && (
          <button
            onClick={onSettleUp}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Wallet className="w-4 h-4" /> Settle Payments
          </button>
        )}
      </div>

      {/* Recommended Direct Transfers */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <ArrowRight className="w-4 h-4 text-emerald-600" />
          Calculated Final Transfers ({finalSettlements.length})
        </h4>

        {finalSettlements.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-4 text-center border border-slate-200/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-sm font-bold text-slate-800">All trip members are fully settled!</p>
            <p className="text-xs text-slate-500 font-medium">No further payments are required.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {finalSettlements.map((st, idx) => {
              const isPayer = st.fromUser.id === currentUser.id;
              const isReceiver = st.toUser.id === currentUser.id;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 ${
                    isPayer
                      ? 'border-rose-300 ring-2 ring-rose-500/10'
                      : isReceiver
                      ? 'border-emerald-300 ring-2 ring-emerald-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={st.fromUser.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {st.fromUser.name} {isPayer ? '(You)' : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                        pays <span className="font-bold text-slate-800">{st.toUser.name}</span> {isReceiver ? '(You)' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-emerald-700 block">
                      {formatCurrency(st.amount, trip.currency)}
                    </span>
                    {isPayer && (
                      <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider block">
                        You owe
                      </span>
                    )}
                    {isReceiver && (
                      <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                        You receive
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Host-Only Breakdown: Who Needs to Pay & Who Needs to Receive */}
      {isHost && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/80 pt-4">
          {/* Debtors: Who Needs to Pay */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Who Needs to Pay ({debtors.length})
            </h4>
            {debtors.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Nobody owes any money.</p>
            ) : (
              <div className="space-y-2">
                {debtors.map((d) => (
                  <div key={d.user.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={d.user.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {d.user.name} {d.user.id === currentUser.id ? '(You)' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-700 shrink-0">
                      Owes {formatCurrency(Math.abs(d.netBalance), trip.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Creditors: Who Needs to Receive */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Who Needs to Receive ({creditors.length})
            </h4>
            {creditors.length === 0 ? (
              <p className="text-xs text-slate-500 font-medium">Nobody is owed money.</p>
            ) : (
              <div className="space-y-2">
                {creditors.map((c) => (
                  <div key={c.user.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={c.user.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {c.user.name} {c.user.id === currentUser.id ? '(You)' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 shrink-0">
                      Gets {formatCurrency(c.netBalance, trip.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
