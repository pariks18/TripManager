'use client';

import React, { useState } from 'react';
import { SettlementRecordDetail, SettlementTransaction } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface SettlementListProps {
  settlements: SettlementTransaction[];
  settlementRecords?: SettlementRecordDetail[];
  currency: string;
  currentUserId: string;
  isAdmin?: boolean;
  tripId?: string;
  onRefresh?: () => void;
}

export const SettlementList: React.FC<SettlementListProps> = React.memo(({
  settlements,
  settlementRecords = [],
  currency,
  currentUserId,
  isAdmin = false,
  tripId,
  onRefresh,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const pendingRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'PENDING'), [settlementRecords]);
  const confirmedRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'CONFIRMED' || r.status === 'COMPLETED'), [settlementRecords]);
  const rejectedRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'REJECTED'), [settlementRecords]);

  const handleCopyUPI = (fromName: string, toName: string, amount: number, id: string) => {
    const text = `Hey ${fromName}, please pay ${formatCurrency(amount, currency)} to ${toName} for the trip settlement.`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsSettled = async (tx: SettlementTransaction) => {
    if (!tripId) return;
    setSubmittingId(tx.id);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: tx.fromUser.id,
          toUserId: tx.toUser.id,
          amount: tx.amount,
          status: 'PENDING',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit settlement');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to submit settlement');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproveSettlement = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve settlement');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve settlement');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectSettlement = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject settlement');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reject settlement');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Pending Settlement Approval Requests Section */}
      {pendingRecords.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Pending Settlement Approvals</h4>
                <p className="text-[11px] text-amber-700">Waiting for receiver or host confirmation</p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {pendingRecords.length} Pending
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {pendingRecords.map((record) => {
              const isPayer = record.fromUserId === currentUserId;
              const isReceiver = record.toUserId === currentUserId;
              const canApprove = isReceiver || isAdmin;

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl p-4 border border-amber-200/80 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    {/* From User */}
                    <div className="flex items-center gap-2">
                      <Avatar name={record.fromUser.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900">
                        {isPayer ? 'You' : record.fromUser.name}
                      </span>
                    </div>

                    {/* Amount & Arrow */}
                    <div className="flex flex-col items-center px-2">
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {formatCurrency(record.amount, currency)}
                      </span>
                      <div className="flex items-center text-[10px] text-amber-700 font-medium mt-0.5">
                        pays <ArrowRight className="w-3 h-3 ml-0.5" />
                      </div>
                    </div>

                    {/* To User */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {isReceiver ? 'You' : record.toUser.name}
                      </span>
                      <Avatar name={record.toUser.name} size="sm" />
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      {isPayer
                        ? 'Waiting for recipient confirmation'
                        : isReceiver
                        ? 'Confirm payment received'
                        : 'Host Override Authority Active'}
                    </span>

                    {canApprove ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectSettlement(record.id)}
                          disabled={submittingId === record.id}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveSettlement(record.id)}
                          disabled={submittingId === record.id}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                        Pending Receiver Approval
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Debt Optimization Header */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-4 flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <p className="text-xs text-blue-900 leading-relaxed font-medium">
          <span className="font-bold">Debt Optimization Engine:</span> We consolidated all expense shares down to <span className="underline font-bold">{settlements.length}</span> minimal transfer{settlements.length > 1 ? 's' : ''}.
        </p>
      </div>

      {/* 3. Calculated Minimal Transfer List */}
      {settlements.length > 0 ? (
        <div className="space-y-3">
          {settlements.map((tx) => {
            const isPayer = tx.fromUser.id === currentUserId;
            const isReceiver = tx.toUser.id === currentUserId;

            // Check if there is already a pending settlement for this pair
            const existingPending = pendingRecords.find(
              (r) => r.fromUserId === tx.fromUser.id && r.toUserId === tx.toUser.id
            );

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-3xl p-4 border transition-all duration-200 apple-shadow space-y-3 ${
                  existingPending
                    ? 'border-amber-200 bg-amber-50/30'
                    : isPayer
                    ? 'border-rose-200 ring-1 ring-rose-100'
                    : isReceiver
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : 'border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* From User */}
                  <div className="flex items-center gap-2">
                    <Avatar name={tx.fromUser.name} size="sm" />
                    <span className="text-sm font-bold text-slate-900">
                      {isPayer ? 'You' : tx.fromUser.name}
                    </span>
                  </div>

                  {/* Transfer Arrow & Amount */}
                  <div className="flex flex-col items-center px-3">
                    <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      {formatCurrency(tx.amount, currency)}
                    </span>
                    <div className="flex items-center text-slate-400 text-xs mt-1 font-medium">
                      pays <ArrowRight className="w-3.5 h-3.5 ml-1 text-slate-500" />
                    </div>
                  </div>

                  {/* To User */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {isReceiver ? 'You' : tx.toUser.name}
                    </span>
                    <Avatar name={tx.toUser.name} size="sm" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleCopyUPI(tx.fromUser.name, tx.toUser.name, tx.amount, tx.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedId === tx.id ? 'Copied Details!' : 'Copy Payment Info'}
                  </button>

                  {existingPending ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-2xl">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkAsSettled(tx)}
                      disabled={submittingId === tx.id}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {submittingId === tx.id ? 'Submitting...' : 'Mark as Settled'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-emerald-900">Everyone is All Settled Up!</h4>
          <p className="text-xs text-emerald-700 max-w-xs mx-auto">
            No remaining debts exist for this trip. Outstanding balances are perfectly zero!
          </p>
        </div>
      )}

      {/* 4. Confirmed Settlement History Section */}
      {confirmedRecords.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Confirmed Settlement Log</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {confirmedRecords.length} Settled
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {confirmedRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{rec.fromUser.name}</span>
                  <span className="text-slate-400">paid</span>
                  <span className="font-bold text-slate-900">{rec.toUser.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-emerald-700">
                    {formatCurrency(rec.amount, currency)}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                    Settled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
