'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ExpenseDetail, UserSummary } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Receipt, ArrowUpRight, ArrowDownLeft, Tag, Calendar } from 'lucide-react';

interface ExpenseBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  currentUserId: string;
  otherMember: UserSummary | null;
  expenses: ExpenseDetail[];
}

export const ExpenseBreakdownModal: React.FC<ExpenseBreakdownModalProps> = ({
  isOpen,
  onClose,
  currency,
  currentUserId,
  otherMember,
  expenses = [],
}) => {
  if (!otherMember) return null;

  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED');

  // 1. Expenses paid by otherMember where currentUserId is a participant (You owe them for these)
  const paidByOtherUserShare = approvedExpenses
    .map((exp) => {
      if (exp.paidById !== otherMember.id) return null;
      const participant = exp.participants?.find((p) => p.userId === currentUserId);
      if (!participant || participant.shareAmount <= 0) return null;
      return {
        expense: exp,
        shareAmount: participant.shareAmount,
        type: 'YOU_OWE' as const,
      };
    })
    .filter(Boolean) as { expense: ExpenseDetail; shareAmount: number; type: 'YOU_OWE' }[];

  // 2. Expenses paid by currentUserId where otherMember is a participant (They owe you for these)
  const paidByYouMemberShare = approvedExpenses
    .map((exp) => {
      if (exp.paidById !== currentUserId) return null;
      const participant = exp.participants?.find((p) => p.userId === otherMember.id);
      if (!participant || participant.shareAmount <= 0) return null;
      return {
        expense: exp,
        shareAmount: participant.shareAmount,
        type: 'THEY_OWE' as const,
      };
    })
    .filter(Boolean) as { expense: ExpenseDetail; shareAmount: number; type: 'THEY_OWE' }[];

  const totalYouOweShare = paidByOtherUserShare.reduce((sum, item) => sum + item.shareAmount, 0);
  const totalTheyOweShare = paidByYouMemberShare.reduce((sum, item) => sum + item.shareAmount, 0);

  const hasExpenses = paidByOtherUserShare.length > 0 || paidByYouMemberShare.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Expense Breakdown with ${otherMember.name}`}
    >
      <div className="space-y-4">
        {/* Header Summary Banner */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={otherMember.name} size="md" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">{otherMember.name}</h4>
              <p className="text-[11px] text-slate-500 font-medium">Shared expense breakdown</p>
            </div>
          </div>

          <div className="text-right">
            {totalYouOweShare > totalTheyOweShare && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 block">Your Share Owed</span>
                <span className="text-base font-black text-rose-600">
                  {formatCurrency(totalYouOweShare - totalTheyOweShare, currency)}
                </span>
              </div>
            )}
            {totalTheyOweShare > totalYouOweShare && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 block">Owed to You</span>
                <span className="text-base font-black text-emerald-600">
                  {formatCurrency(totalTheyOweShare - totalYouOweShare, currency)}
                </span>
              </div>
            )}
            {totalYouOweShare === totalTheyOweShare && (
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Net Share</span>
                <span className="text-base font-bold text-slate-700">{currency}0</span>
              </div>
            )}
          </div>
        </div>

        {/* Expenses List */}
        {hasExpenses ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Section 1: Expenses Paid by Other Member (You have to pay your share) */}
            {paidByOtherUserShare.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    Expenses paid by {otherMember.name} (Your Share)
                  </span>
                  <span className="text-[11px] font-extrabold text-rose-600">
                    Total: {formatCurrency(totalYouOweShare, currency)}
                  </span>
                </div>

                <div className="space-y-2">
                  {paidByOtherUserShare.map(({ expense, shareAmount }) => (
                    <div
                      key={expense.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{expense.title}</h5>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-400" /> {expense.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(expense.date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Your Share to pay</span>
                          <span className="text-sm font-extrabold text-rose-600">
                            {formatCurrency(shareAmount, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                        <span>Total Expense Amount:</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(expense.amount, currency)} (Paid by {otherMember.name})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Expenses Paid by You (Member has to pay their share) */}
            {paidByYouMemberShare.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    Expenses paid by You ({otherMember.name}'s Share)
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-600">
                    Total: {formatCurrency(totalTheyOweShare, currency)}
                  </span>
                </div>

                <div className="space-y-2">
                  {paidByYouMemberShare.map(({ expense, shareAmount }) => (
                    <div
                      key={expense.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-bold text-slate-900">{expense.title}</h5>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 font-semibold flex items-center gap-1">
                              <Tag className="w-3 h-3 text-slate-400" /> {expense.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" /> {formatDate(expense.date)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-medium">Their Share to pay</span>
                          <span className="text-sm font-extrabold text-emerald-600">
                            {formatCurrency(shareAmount, currency)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                        <span>Total Expense Amount:</span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(expense.amount, currency)} (Paid by You)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              No direct shared expenses found between you and {otherMember.name}.
            </p>
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
