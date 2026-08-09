'use client';

import React, { useState } from 'react';
import { ExpenseDetail } from '@/types';
import { CATEGORY_CONFIG, formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Utensils, Plane, Fuel, Home, Ticket, ShoppingBag, Sparkles, MoreVertical, Edit2, Trash2, ShieldCheck, Lock, ChevronDown, ChevronUp, Receipt, ExternalLink, Download } from 'lucide-react';

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
  const [showMenu, setShowMenu] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const catStyle = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG['Miscellaneous'];
  const IconComponent = ICON_MAP[catStyle.icon] || Sparkles;

  const isPayer = expense.paidById === currentUserId;
  const isCreator = expense.createdById === currentUserId;
  const isApproved = expense.status === 'APPROVED';
  const isPending = expense.status === 'PENDING_APPROVAL';
  const isRejected = expense.status === 'REJECTED';

  const canDirectModify = isAdmin || (!isApproved && isCreator);

  const userParticipant = expense.participants?.find((p) => p.userId === currentUserId);
  const totalParticipantsCount = expense.participants?.length || 1;
  const perPersonShare = expense.amount / totalParticipantsCount;

  let netText = '';
  let netColor = '';

  if (isPayer && userParticipant) {
    const netGain = expense.amount - perPersonShare;
    netText = `you lent ${formatCurrency(netGain, currency)}`;
    netColor = 'text-emerald-600 font-bold';
  } else if (isPayer && !userParticipant) {
    netText = `you lent ${formatCurrency(expense.amount, currency)}`;
    netColor = 'text-emerald-600 font-bold';
  } else if (!isPayer && userParticipant) {
    netText = `you owe ${formatCurrency(perPersonShare, currency)}`;
    netColor = 'text-rose-600 font-bold';
  } else {
    netText = 'not involved';
    netColor = 'text-slate-400 font-medium';
  }

  return (
    <>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow relative group hover:border-emerald-200 transition-all duration-200 space-y-3">
        {/* Top Main Details */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${catStyle.bg} shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900 line-clamp-1">{expense.title}</h4>
                {isPending && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ⏳ Pending Review
                  </span>
                )}
                {isApproved && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ✓ Approved
                  </span>
                )}
                {isRejected && (
                  <span
                    className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    title={expense.rejectionReason ? `Reason: ${expense.rejectionReason}` : 'Rejected'}
                  >
                    ❌ Rejected
                  </span>
                )}
                {expense.receiptUrl && (
                  <button
                    onClick={() => setShowReceiptModal(true)}
                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 transition-colors"
                  >
                    <Receipt className="w-3 h-3 text-emerald-600" /> Receipt
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Paid by <span className="font-semibold text-slate-800">{isPayer ? 'You' : expense.paidBy?.name}</span> • {formatDate(expense.date)}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-base font-extrabold text-slate-900 block">
              {formatCurrency(expense.amount, currency)}
            </span>
            <span className={`text-xs block mt-0.5 ${netColor}`}>{netText}</span>
          </div>
        </div>

        {/* Rejection Note Alert if Rejected */}
        {isRejected && expense.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-2.5 text-xs text-rose-800 flex items-start gap-2">
            <span className="font-bold shrink-0">Reason:</span>
            <span>"{expense.rejectionReason}"</span>
          </div>
        )}

        {/* Super Host Quick Approve/Reject Bar */}
        {isAdmin && isPending && (onApprove || onReject) && (
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-900">Awaiting Super Host verification</span>
            <div className="flex items-center gap-2">
              {onApprove && (
                <button
                  onClick={() => onApprove(expense.id)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(expense.id)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors"
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        )}

        {/* Expense Calculation Transparency Accordion */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
          <button
            onClick={() => setShowCalculationDetails(!showCalculationDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Calculation Breakdown
            </span>
            <span className="text-[11px] text-slate-400 font-mono font-bold flex items-center">
              {formatCurrency(perPersonShare, currency)} / person
              {showCalculationDetails ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-500" />
              )}
            </span>
          </button>

          {showCalculationDetails && (
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(expense.amount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Split Members ({totalParticipantsCount}):</span>
                <span className="font-semibold text-slate-800">
                  {expense.participants?.map((p) => p.user?.name).join(', ')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/40">
                <span className="font-semibold text-slate-700">Formula:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {formatCurrency(expense.amount, currency)} ÷ {totalParticipantsCount} = {formatCurrency(perPersonShare, currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Split Avatars & Menu Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Participants:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {expense.participants?.map((p) => (
                  <Avatar key={p.id} name={p.user?.name || ''} size="sm" className="w-6 h-6 text-[10px] ring-1 ring-white" />
                ))}
              </div>
            </div>

            {expense.receiptUrl && (
              <button
                onClick={() => setShowReceiptModal(true)}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 underline flex items-center gap-0.5"
              >
                View Receipt
              </button>
            )}
          </div>

          {/* Action Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-20 space-y-1">
                  {canDirectModify ? (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(expense);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> {isRejected ? 'Resubmit' : 'Edit'}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete(expense.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit(expense);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-blue-600" /> Request Edit
                      </button>
                      {onRequestDelete && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            onRequestDelete(expense.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Request Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Viewer Lightbox Modal */}
      {showReceiptModal && expense.receiptUrl && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title={`Receipt Proof - ${expense.title}`}
        >
          <div className="space-y-4 text-center">
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={expense.receiptUrl}
                alt={`Receipt for ${expense.title}`}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium text-slate-600 px-1">
              <span>Amount: <strong className="text-slate-900">{formatCurrency(expense.amount, currency)}</strong></span>
              <span>Date: {formatDate(expense.date)}</span>
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href={expense.receiptUrl}
                download={`receipt_${expense.title.toLowerCase().replace(/\s+/g, '_')}.png`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download Proof
              </a>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
});

