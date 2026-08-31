'use client';

import React, { useState } from 'react';
import { ExpenseDetail } from '@/types';
import { CATEGORY_CONFIG, formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import {
  Utensils,
  Plane,
  Fuel,
  Home,
  Ticket,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ExpenseCardProps {
  expense: ExpenseDetail;
  currency: string;
  currentUserId: string;
  isAdmin?: boolean;
  onEdit: (expense: ExpenseDetail) => void;
  onDelete: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
  onRequestDelete?: (expenseId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils,
  Plane,
  Fuel,
  Home,
  Ticket,
  ShoppingBag,
  Sparkles,
};

export const ExpenseCard: React.FC<ExpenseCardProps> = React.memo(({
  expense,
  currency,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onRequestDelete,
}) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const catStyle = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG['Miscellaneous'];
  const IconComponent = ICON_MAP[catStyle.icon] || Sparkles;

  const isPayer = expense.paidById === currentUserId;
  const isApproved = expense.status === 'APPROVED';
  const isPending = expense.status === 'PENDING_APPROVAL';
  const isRejected = expense.status === 'REJECTED';

  const userParticipant = expense.participants?.find((p) => p.userId === currentUserId);
  const totalParticipantsCount = expense.participants?.length || 1;
  const perPersonShare = expense.amount / totalParticipantsCount;

  let netText = '';
  let netColorClass = '';

  if (isPayer && userParticipant) {
    const netGain = expense.amount - perPersonShare;
    netText = `you lent ${formatCurrency(netGain, currency)}`;
    netColorClass = 'text-emerald-700 font-bold';
  } else if (isPayer && !userParticipant) {
    netText = `you lent ${formatCurrency(expense.amount, currency)}`;
    netColorClass = 'text-emerald-700 font-bold';
  } else if (!isPayer && userParticipant) {
    netText = `you owe ${formatCurrency(perPersonShare, currency)}`;
    netColorClass = 'text-rose-600 font-bold';
  } else {
    netText = 'not involved';
    netColorClass = 'text-slate-400 font-medium';
  }

  const payerName =
    expense.payers && expense.payers.length > 1
      ? expense.payers
          .map(
            (p) =>
              `${p.userId === currentUserId ? 'You' : p.user?.name || 'User'} (${formatCurrency(p.amount, currency)})`
          )
          .join(' + ')
      : isPayer
      ? 'You'
      : expense.paidBy?.name || 'Someone';

  return (
    <>
      <div
        onClick={() => setIsDetailOpen(true)}
        className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-100/90 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 sm:gap-3 active:scale-[0.99] group min-w-0"
      >
        {/* Left: Icon & Details */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`p-2.5 sm:p-3 rounded-2xl ${catStyle.bg} shrink-0 group-hover:scale-105 transition-transform`}>
            <IconComponent className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-700" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">{expense.title}</h4>

              {isPending && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  Pending
                </span>
              )}
              {isRejected && (
                <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  Rejected
                </span>
              )}
              {expense.receiptUrl && (
                <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate font-medium">
              {payerName} paid · {formatCurrency(expense.amount, currency)}
            </p>
          </div>
        </div>

        {/* Right: Net Status & Arrow */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 text-right">
          <div>
            <span className="text-xs sm:text-sm font-black text-slate-900 block">
              {formatCurrency(expense.amount, currency)}
            </span>
            <span className={`text-[10px] sm:text-[11px] block mt-0.5 ${netColorClass} truncate max-w-[90px] sm:max-w-none`}>
              {netText}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </div>

      {/* Detail Modal */}
      {isDetailOpen && (
        <ExpenseDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          expense={expense}
          currency={currency}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </>
  );
});
