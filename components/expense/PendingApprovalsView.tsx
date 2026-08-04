'use client';

import React, { useState } from 'react';
import { ExpenseDetail, ExpenseEditRequestDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Edit3, Trash2, Clock, Receipt, FileText } from 'lucide-react';

interface PendingApprovalsViewProps {
  tripId: string;
  currency: string;
  pendingExpenses: ExpenseDetail[];
  pendingRequests: ExpenseEditRequestDetail[];
  onActionComplete: () => void;
}

export const PendingApprovalsView: React.FC<PendingApprovalsViewProps> = ({
  tripId,
  currency,
  pendingExpenses,
  pendingRequests,
  onActionComplete,
}) => {
  const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleApproveExpense = async (expenseId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (!res.ok) throw new Error('Failed to approve expense');
      onActionComplete();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingExpenseId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${rejectingExpenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: rejectionReason.trim() }),
      });
      if (!res.ok) throw new Error('Failed to reject expense');

      setRejectingExpenseId(null);
      setRejectionReason('');
      onActionComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessEditRequest = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/edit-requests/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action.toLowerCase()} request`);
      onActionComplete();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPendingCount = pendingExpenses.length + pendingRequests.length;

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-5 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-emerald-950">Super Host Verification Dashboard</h3>
          <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
            Review pending expense submissions and edit/delete requests. Only approved expenses affect trip balances and settlements.
          </p>
        </div>
      </div>

      {totalPendingCount === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-2 apple-shadow">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">All Approvals Clear!</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            There are currently no pending expenses or edit requests awaiting verification.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Pending Expenses */}
          {pendingExpenses.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Pending Expense Submissions ({pendingExpenses.length})
                </h4>
              </div>

              <div className="space-y-3">
                {pendingExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-slate-900">{exp.title}</h5>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted by <span className="font-semibold text-slate-800">{exp.createdBy?.name || exp.paidBy?.name}</span> • {formatDate(exp.date)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-base font-extrabold text-slate-900 block">
                          {formatCurrency(exp.amount, currency)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">Category: {exp.category}</span>
                      </div>
                    </div>

                    {exp.receiptUrl && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                        <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Receipt photo attached by member</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <Button
                        size="sm"
                        onClick={() => handleApproveExpense(exp.id)}
                        isLoading={isSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Expense
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingExpenseId(exp.id);
                          setRejectionReason('');
                        }}
                        className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Edit & Delete Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  Member Edit & Delete Requests ({pendingRequests.length})
                </h4>
              </div>

              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  let proposedObj: any = null;
                  if (req.proposedData) {
                    try {
                      proposedObj = JSON.parse(req.proposedData);
                    } catch {}
                  }

                  return (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              req.requestType === 'DELETE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.requestType === 'DELETE' ? 'Delete Request' : 'Edit Request'}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Requested by {req.requestedBy.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(req.createdAt)}</span>
                      </div>

                      {req.requestType === 'EDIT' && proposedObj && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <p className="text-slate-500 font-medium">Proposed Changes:</p>
                          <p className="font-bold text-slate-900">
                            Title: {proposedObj.title} • Amount: {formatCurrency(proposedObj.amount, currency)}
                          </p>
                          <p className="text-slate-600">Category: {proposedObj.category}</p>
                        </div>
                      )}

                      {req.requestType === 'DELETE' && (
                        <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
                          Member has requested to permanently delete this approved expense.
                        </div>
                      )}

                      {req.reason && (
                        <p className="text-xs text-slate-600 italic">Reason: "{req.reason}"</p>
                      )}

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <Button
                          size="sm"
                          onClick={() => handleProcessEditRequest(req.id, 'APPROVE')}
                          isLoading={isSubmitting}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Request
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleProcessEditRequest(req.id, 'REJECT')}
                          className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Reject Request
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Reject Expense Modal */}
      {rejectingExpenseId && (
        <Modal
          isOpen={!!rejectingExpenseId}
          onClose={() => setRejectingExpenseId(null)}
          title="Reject Expense Submission"
        >
          <form onSubmit={handleRejectExpenseSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Rejection Reason / Note (Optional)
              </label>
              <textarea
                placeholder="e.g. Incorrect receipt, wrong amount split..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 focus:outline-none focus:border-rose-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="submit"
                variant="danger"
                fullWidth
                isLoading={isSubmitting}
                size="lg"
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
