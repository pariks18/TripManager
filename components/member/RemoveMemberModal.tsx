'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  AlertTriangle,
  UserX,
  CheckCircle2,
  RefreshCw,
  X,
  CreditCard,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currency: string;
  memberUserId: string;
  memberName: string;
  onSuccess: () => void;
}

interface MemberStatusResponse {
  targetUser: { id: string; name: string; email: string };
  role: string;
  canRemoveDirectly: boolean;
  netBalance: number;
  pendingSettlementsCount: number;
  pendingExpensesCount: number;
  pendingEditRequestsCount: number;
  details: {
    paidAmount: number;
    shareAmount: number;
    owes: number;
    getsBack: number;
  };
}

export const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  isOpen,
  onClose,
  tripId,
  currency,
  memberUserId,
  memberName,
  onSuccess,
}) => {
  const [status, setStatus] = useState<MemberStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tripId && memberUserId) {
      fetchMemberStatus();
    }
  }, [isOpen, tripId, memberUserId]);

  const fetchMemberStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${memberUserId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check member status');
      setStatus(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error checking member status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (action: 'REMOVE' | 'SETTLE_AND_REMOVE' | 'REASSIGN_AND_REMOVE') => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/members/${memberUserId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to execute member removal action');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-2xl">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove {memberName}</h3>
              <p className="text-xs text-slate-400">Super Host Member Removal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Checking pending balances & expenses...</p>
            </div>
          ) : status ? (
            status.canRemoveDirectly ? (
              // Clean Removal Prompt
              <div className="space-y-4 text-center py-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">No Pending Balances Found!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {memberName} has a net balance of {currency}0 and no pending transactions. They can be safely removed.
                  </p>
                </div>

                <div className="pt-3 flex gap-3">
                  <Button variant="secondary" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleRemoveMember('REMOVE')}
                    disabled={isSubmitting}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    {isSubmitting ? 'Removing...' : 'Confirm Remove'}
                  </Button>
                </div>
              </div>
            ) : (
              // Warning Prompt for Pending Balances / Unsettled Expenses
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Unsettled Balances & Expenses Found
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Before removing <span className="font-bold">{memberName}</span>, pending expenses or debts must be settled or reassigned.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Balance</span>
                      <span
                        className={`text-sm font-extrabold block ${
                          status.netBalance > 0
                            ? 'text-emerald-600'
                            : status.netBalance < 0
                            ? 'text-rose-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {status.netBalance > 0
                          ? `Gets Back +${formatCurrency(status.netBalance, currency).replace('+', '')}`
                          : status.netBalance < 0
                          ? `Owes ${formatCurrency(status.netBalance, currency)}`
                          : `${currency}0`}
                      </span>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Items</span>
                      <span className="text-sm font-extrabold text-slate-800 block">
                        {status.pendingSettlementsCount + status.pendingExpensesCount} Transactions
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">Select Host Resolution Strategy:</span>

                  {/* Resolution Option 1: Settle & Remove */}
                  <button
                    onClick={() => handleRemoveMember('SETTLE_AND_REMOVE')}
                    disabled={isSubmitting}
                    className="w-full text-left p-3.5 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl transition-all group flex items-start gap-3"
                  >
                    <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 group-hover:text-emerald-950">
                          Settle Balances & Remove
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5 leading-snug">
                        Automatically record a confirmed Host settlement to zero out {memberName}'s balance and remove them.
                      </p>
                    </div>
                  </button>

                  {/* Resolution Option 2: Reassign & Remove */}
                  <button
                    onClick={() => handleRemoveMember('REASSIGN_AND_REMOVE')}
                    disabled={isSubmitting}
                    className="w-full text-left p-3.5 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 rounded-2xl transition-all group flex items-start gap-3"
                  >
                    <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 group-hover:text-blue-950">
                          Reassign Expenses & Remove
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-snug">
                        Reassign {memberName}'s paid expenses and shares to Super Host, then remove them cleanly.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <Button variant="secondary" onClick={onClose} className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};
