'use client';

import React, { useState } from 'react';
import { ExpenseDetail } from '@/types';
import { CATEGORY_CONFIG, formatCurrency, formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import {
  Utensils,
  Plane,
  Fuel,
  Home,
  Ticket,
  ShoppingBag,
  Sparkles,
  Receipt,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Calendar,
  User,
  Calculator,
} from 'lucide-react';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseDetail | null;
  currency: string;
  currentUserId: string;
  isAdmin?: boolean;
  onEdit?: (expense: ExpenseDetail) => void;
  onDelete?: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onReject?: (expenseId: string) => void;
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

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  isOpen,
  onClose,
  expense,
  currency,
  currentUserId,
  isAdmin = false,
  onEdit,
  onDelete,
  onApprove,
  onReject,
}) => {
  const [showReceiptImage, setShowReceiptImage] = useState(false);

  if (!expense) return null;

  const catStyle = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG['Miscellaneous'];
  const IconComponent = ICON_MAP[catStyle.icon] || Sparkles;

  const isPayer = expense.paidById === currentUserId;
  const isCreator = expense.createdById === currentUserId;
  const isApproved = expense.status === 'APPROVED';
  const isPending = expense.status === 'PENDING_APPROVAL';
  const isRejected = expense.status === 'REJECTED';

  const canModify = isAdmin || (!isApproved && isCreator);

  const userParticipant = expense.participants?.find((p) => p.userId === currentUserId);
  const totalParticipantsCount = expense.participants?.length || 1;
  const perPersonShare = expense.amount / totalParticipantsCount;

  let netText = '';
  let netColorClass = '';

  if (isPayer && userParticipant) {
    const netGain = expense.amount - perPersonShare;
    netText = `You lent ${formatCurrency(netGain, currency)}`;
    netColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (isPayer && !userParticipant) {
    netText = `You lent ${formatCurrency(expense.amount, currency)}`;
    netColorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  } else if (!isPayer && userParticipant) {
    netText = `You owe ${formatCurrency(perPersonShare, currency)}`;
    netColorClass = 'text-rose-600 bg-rose-50 border-rose-200';
  } else {
    netText = 'Not involved in split';
    netColorClass = 'text-slate-500 bg-slate-100 border-slate-200';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details">
      <div className="space-y-5 py-1">
        {/* Top Title & Category Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${catStyle.bg} shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-snug">{expense.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold">{expense.category}</span>
                <span>•</span>
                <span>{formatDate(expense.date)}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 block">
              {formatCurrency(expense.amount, currency)}
            </span>
            <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${netColorClass}`}>
              {netText}
            </span>
          </div>
        </div>

        {/* Status Badge & Rejection Alert */}
        <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Approval Status</span>
          {isApproved && (
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
            </span>
          )}
          {isPending && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
            </span>
          )}
          {isRejected && (
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
            </span>
          )}
        </div>

        {isRejected && expense.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 text-xs text-rose-900 space-y-1">
            <span className="font-bold block text-rose-950">Rejection Note:</span>
            <p className="italic">"{expense.rejectionReason}"</p>
          </div>
        )}

        {/* Paid By & Split Formula Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Paid by</span>
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Avatar name={expense.paidBy?.name || 'User'} size="sm" />
              <span>{isPayer ? 'You' : expense.paidBy?.name}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Split Calculation</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatCurrency(expense.amount, currency)} ÷ {totalParticipantsCount} = {formatCurrency(perPersonShare, currency)} / person
            </span>
          </div>
        </div>

        {/* Participants & Share List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Split Participants ({totalParticipantsCount})
          </h4>
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 shadow-sm">
            {expense.participants?.map((p) => {
              const isSelf = p.userId === currentUserId;
              return (
                <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.user?.name || ''} size="sm" />
                    <span className="font-bold text-slate-900">
                      {p.user?.name} {isSelf ? '(You)' : ''}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-700">
                    {formatCurrency(p.shareAmount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Receipt Proof Photo */}
        {expense.receiptUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Receipt Proof
              </h4>
              <a
                href={expense.receiptUrl}
                download={`receipt_${expense.title.toLowerCase().replace(/\s+/g, '_')}.png`}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-56 flex items-center justify-center p-2">
              <img
                src={expense.receiptUrl}
                alt={`Receipt for ${expense.title}`}
                className="max-h-52 w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="pt-2 space-y-2">
          {isAdmin && isPending && (onApprove || onReject) && (
            <div className="grid grid-cols-2 gap-3 pb-2">
              {onApprove && (
                <button
                  onClick={() => {
                    onApprove(expense.id);
                    onClose();
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Expense
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => {
                    onReject(expense.id);
                    onClose();
                  }}
                  className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Expense
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {canModify && onEdit && (
              <button
                onClick={() => {
                  onEdit(expense);
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Expense
              </button>
            )}

            {canModify && onDelete && (
              <button
                onClick={() => {
                  onDelete(expense.id);
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Delete
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
