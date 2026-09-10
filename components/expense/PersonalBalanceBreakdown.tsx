'use client';

import React, { useState } from 'react';
import { ExpenseDetail, SettlementRecordDetail, UserSummary } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface PersonalBalanceBreakdownProps {
  user: UserSummary;
  currency: string;
  paid: number;
  share: number;
  netBalance: number;
  expenses?: ExpenseDetail[];
  settlementRecords?: SettlementRecordDetail[];
  isCurrentUser?: boolean;
  defaultExpanded?: boolean;
}

export const PersonalBalanceBreakdown: React.FC<PersonalBalanceBreakdownProps> = ({
  user,
  currency,
  paid,
  share,
  netBalance,
  expenses = [],
  settlementRecords = [],
  isCurrentUser = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const approvedExpenses = React.useMemo(
    () => expenses.filter((e) => e.status === 'APPROVED'),
    [expenses]
  );

  // 1. Expenses paid by this user
  const paidExpenses = React.useMemo(() => {
    return approvedExpenses
      .map((exp) => {
        let amountPaid = 0;
        if (exp.payers && exp.payers.length > 0) {
          const p = exp.payers.find((payer) => payer.userId === user.id);
          if (p) amountPaid = p.amount;
        } else if (exp.paidById === user.id) {
          amountPaid = exp.amount;
        }

        if (amountPaid <= 0) return null;
        return { expense: exp, amountPaid };
      })
      .filter(Boolean) as { expense: ExpenseDetail; amountPaid: number }[];
  }, [approvedExpenses, user.id]);

  // 2. Expenses where user is a participant (their share)
  const shareExpenses = React.useMemo(() => {
    return approvedExpenses
      .map((exp) => {
        const participant = exp.participants?.find((p) => p.userId === user.id);
        if (!participant || participant.shareAmount <= 0) return null;
        return { expense: exp, shareAmount: participant.shareAmount };
      })
      .filter(Boolean) as { expense: ExpenseDetail; shareAmount: number }[];
  }, [approvedExpenses, user.id]);

  // 3. Active settlements involving this user
  const userSettlements = React.useMemo(() => {
    const valid = settlementRecords.filter(
      (s) =>
        s.status === 'CONFIRMED' ||
        s.status === 'SETTLED' ||
        s.status === 'PARTIALLY_SETTLED' ||
        s.status === 'COMPLETED' ||
        s.status === 'PENDING_REVERSAL' ||
        s.status === 'REVERSAL_DECLINED_PENDING_HOST'
    );

    return valid.filter((s) => s.fromUserId === user.id || s.toUserId === user.id);
  }, [settlementRecords, user.id]);

  const totalSettlementsPaid = React.useMemo(() => {
    return userSettlements
      .filter((s) => s.fromUserId === user.id)
      .reduce((sum, s) => sum + (s.settledAmount || s.amount), 0);
  }, [userSettlements, user.id]);

  const totalSettlementsReceived = React.useMemo(() => {
    return userSettlements
      .filter((s) => s.toUserId === user.id)
      .reduce((sum, s) => sum + (s.settledAmount || s.amount), 0);
  }, [userSettlements, user.id]);

  const isNetPositive = netBalance > 0.01;
  const isNetNegative = netBalance < -0.01;
  const isSettled = !isNetPositive && !isNetNegative;

  const subjectLabel = isCurrentUser ? 'You' : user.name;
  const possessiveLabel = isCurrentUser ? 'Your' : `${user.name}'s`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      {/* Top Banner (SIMPLE BY DEFAULT) */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isSettled
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : isNetNegative
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isSettled ? 'All Settled Up' : isNetNegative ? 'You Owe' : 'You Are Owed'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
              {isSettled ? (
                <span>{isCurrentUser ? 'You are all settled up 🎉' : `${user.name} is all settled up`}</span>
              ) : isNetNegative ? (
                <>
                  {isCurrentUser ? 'You owe ' : `${user.name} owes `}
                  <span className="text-rose-600 font-extrabold">
                    {formatCurrency(Math.abs(netBalance), currency)}
                  </span>
                </>
              ) : (
                <>
                  {isCurrentUser ? 'You are owed ' : `${user.name} is owed `}
                  <span className="text-emerald-600 font-extrabold">
                    {formatCurrency(netBalance, currency)}
                  </span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isSettled
                ? 'No outstanding debt or receivable'
                : isNetNegative
                ? `${subjectLabel} need to pay this amount to clear remaining debt.`
                : `Other members will pay ${subjectLabel.toLowerCase()} to settle trip expenses.`}
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-2xl transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExpanded ? 'Hide Details' : 'How was this calculated?'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3 Metric Cards Row */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 text-center min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              {isCurrentUser ? 'You Paid' : 'Paid'}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate mt-0.5">
              {formatCurrency(paid, currency)}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 text-center min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              {possessiveLabel} Share
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate mt-0.5">
              {formatCurrency(share, currency)}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 text-center min-w-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
              Trip Balance
            </span>
            <span
              className={`text-xs sm:text-sm font-black block truncate mt-0.5 ${
                isNetNegative ? 'text-rose-600' : isNetPositive ? 'text-emerald-600' : 'text-slate-700'
              }`}
            >
              {isNetPositive
                ? `+${formatCurrency(netBalance, currency)}`
                : isNetNegative
                ? `-${formatCurrency(Math.abs(netBalance), currency)}`
                : `${currency}0`}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Calculation Details (PROGRESSIVE DISCLOSURE) */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Calculation Summary
            </h4>
          </div>

          {/* Step 1: Expenses Paid */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                1. Expenses {subjectLabel} Paid ({paidExpenses.length})
              </span>
              <span className="text-xs font-black text-emerald-600">
                Total Paid: {formatCurrency(paid, currency)}
              </span>
            </div>

            {paidExpenses.length > 0 ? (
              <div className="space-y-1.5 divide-y divide-slate-100">
                {paidExpenses.map(({ expense, amountPaid }) => (
                  <div key={expense.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{expense.title}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" /> {expense.category} • {formatDate(expense.date)}
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(amountPaid, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No approved expenses paid by {subjectLabel.toLowerCase()}.</p>
            )}
          </div>

          {/* Step 2: Share of Expenses */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                2. {possessiveLabel} Share of Expenses ({shareExpenses.length})
              </span>
              <span className="text-xs font-black text-rose-600">
                Total Share: {formatCurrency(share, currency)}
              </span>
            </div>

            {shareExpenses.length > 0 ? (
              <div className="space-y-1.5 divide-y divide-slate-100">
                {shareExpenses.map(({ expense, shareAmount }) => (
                  <div key={expense.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{expense.title}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        Total {formatCurrency(expense.amount, currency)} • Split amongst {expense.participants?.length || 1}
                      </span>
                    </div>
                    <span className="font-extrabold text-rose-600">
                      {formatCurrency(shareAmount, currency)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No expense shares assigned to {subjectLabel.toLowerCase()}.</p>
            )}
          </div>

          {/* Step 3: Direct Settlements & Adjustments */}
          {userSettlements.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  3. Settlements & Advances ({userSettlements.length})
                </span>
              </div>

              <div className="space-y-1.5 divide-y divide-slate-100">
                {userSettlements.map((s) => {
                  const isPayer = s.fromUserId === user.id;
                  const effAmt = s.settledAmount || s.amount;
                  const otherPartyName = isPayer ? s.toUser?.name || 'Member' : s.fromUser?.name || 'Member';
                  const isAdvance = s.type === 'ADVANCE_CREDIT';
                  return (
                    <div key={s.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {isAdvance
                            ? (isPayer ? `Advance paid to ${otherPartyName}` : `Advance received from ${otherPartyName}`)
                            : (isPayer ? `Paid to ${otherPartyName}` : `Received from ${otherPartyName}`)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {s.status === 'CONFIRMED' || s.status === 'SETTLED' ? '✓ Settled' : s.status} • {s.note || (isAdvance ? 'Advance Credit' : 'Direct Settlement')}
                        </span>
                      </div>
                      <span className={`font-extrabold ${isPayer ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(effAmt, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 font-medium leading-relaxed">
                💡 Direct settlements adjust outstanding debts without changing historical expense records.
              </div>
            </div>
          )}

          {/* Step 4: Simple Explanation Box */}
          {(() => {
            const expenseNet = paid - share;
            const netSettlements = totalSettlementsPaid - totalSettlementsReceived;
            const isOverpaid = expenseNet < 0 && netSettlements > Math.abs(expenseNet);
            const overpaidAdvanceCredit = isOverpaid ? netSettlements - Math.abs(expenseNet) : 0;

            return (
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Calculation Summary
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (Paid − Share) + Settlements
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Trip Expenses Subtotal */}
                  <div className="space-y-1 pb-2 border-b border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-300">You paid for expenses:</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(paid, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Your share of expenses:</span>
                      <span className="text-rose-400 font-bold">−{formatCurrency(share, currency)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-sans text-[11px] pt-0.5 font-medium">
                      <span>Net expense position:</span>
                      <span className={expenseNet >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {expenseNet >= 0 ? `+${formatCurrency(expenseNet, currency)}` : `-${formatCurrency(Math.abs(expenseNet), currency)}`}
                      </span>
                    </div>
                  </div>

                  {/* Direct Settlements Section */}
                  {(totalSettlementsPaid > 0 || totalSettlementsReceived > 0) && (
                    <div className="space-y-1 pb-2 border-b border-slate-800">
                      {totalSettlementsPaid > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-300">Settlements you paid:</span>
                          <span className="text-emerald-400 font-bold">+{formatCurrency(totalSettlementsPaid, currency)}</span>
                        </div>
                      )}
                      {totalSettlementsReceived > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-300">Settlements you received:</span>
                          <span className="text-rose-400 font-bold">−{formatCurrency(totalSettlementsReceived, currency)}</span>
                        </div>
                      )}
                      {overpaidAdvanceCredit > 0 && (
                        <div className="flex justify-between text-emerald-300 font-sans text-[11px] pt-0.5 font-medium">
                          <span>Applied to debt:</span>
                          <span className="font-bold">-{formatCurrency(Math.abs(expenseNet), currency)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Final Summary Row */}
                  <div className="pt-1 flex flex-col space-y-2">
                    <div className="flex justify-between font-extrabold text-sm">
                      <span>Current Balance:</span>
                      <span className={isNetNegative ? 'text-rose-400' : 'text-emerald-400'}>
                        {isNetPositive
                          ? `You are owed ${formatCurrency(netBalance, currency)}`
                          : isNetNegative
                          ? `You owe ${formatCurrency(Math.abs(netBalance), currency)}`
                          : `All settled up 🎉 (${currency}0)`}
                      </span>
                    </div>
                    {overpaidAdvanceCredit > 0 && (
                      <div className="flex justify-between font-extrabold text-xs text-emerald-300 bg-emerald-950/80 p-2.5 rounded-xl border border-emerald-700/80">
                        <span>Available advance credit (to receive/refund):</span>
                        <span>{formatCurrency(overpaidAdvanceCredit, currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
