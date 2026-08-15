import React, { useState } from 'react';
import { SettlementRecordDetail, SettlementTransaction, TripMemberDetail, UserWalletDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import { SettleUpModal } from './SettleUpModal';
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
  RotateCcw,
  Undo2,
  AlertTriangle,
  History,
  Plus,
  FileText,
} from 'lucide-react';

interface SettlementListProps {
  settlements: SettlementTransaction[];
  settlementRecords?: SettlementRecordDetail[];
  currency: string;
  currentUserId: string;
  members?: TripMemberDetail[];
  myWallet?: UserWalletDetail | null;
  allWallets?: UserWalletDetail[];
  isAdmin?: boolean;
  tripId?: string;
  onRefresh?: () => void;
}

export const SettlementList: React.FC<SettlementListProps> = React.memo(({
  settlements,
  settlementRecords = [],
  currency,
  currentUserId,
  members = [],
  myWallet,
  allWallets = [],
  isAdmin = false,
  tripId,
  onRefresh,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rollbackConfirmId, setRollbackConfirmId] = useState<string | null>(null);

  // Settle Up Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleModalTx, setSettleModalTx] = useState<SettlementTransaction | null>(null);

  const pendingRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'PENDING'), [settlementRecords]);
  const rollbackRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'ROLLBACK_REQUESTED'), [settlementRecords]);
  const confirmedRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'CONFIRMED' || r.status === 'SETTLED' || r.status === 'PARTIALLY_SETTLED' || r.status === 'COMPLETED'), [settlementRecords]);
  const historyRecords = React.useMemo(() => settlementRecords.filter((r) => r.status === 'REJECTED' || r.status === 'ROLLED_BACK'), [settlementRecords]);

  const handleCopyUPI = (fromName: string, toName: string, amount: number, id: string) => {
    const text = `Hey ${fromName}, please pay ${formatCurrency(amount, currency)} to ${toName} for the trip settlement.`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSettleModal = (tx: SettlementTransaction | null) => {
    setSettleModalTx(tx);
    setIsSettleModalOpen(true);
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

  const handleRequestRollback = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST_ROLLBACK' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request settlement rollback');

      setRollbackConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to request settlement rollback');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleApproveRollback = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_ROLLBACK' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve rollback');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve rollback');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectRollback = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT_ROLLBACK' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject rollback');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reject rollback');
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

              // Find live outstanding balance between this pair
              const pairTx = settlements.find(
                (s) => s.fromUser.id === record.fromUserId && s.toUser.id === record.toUserId
              );
              const currentOutstanding = pairTx ? pairTx.amount : 0;
              const remainingAfterApproval = Math.max(0, Math.round((currentOutstanding - record.amount) * 100) / 100);

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
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {formatCurrency(record.amount, currency)}
                        </span>
                      </div>
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

                  {/* Calculation Breakdown Preview */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Outstanding:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(currentOutstanding, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-semibold">Amount Being Settled:</span>
                      <span className="font-extrabold text-amber-800">{formatCurrency(record.amount, currency)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 font-bold">
                      <span className="text-slate-700">Remaining After Approval:</span>
                      <span className="font-mono text-emerald-700">{formatCurrency(remainingAfterApproval, currency)}</span>
                    </div>
                    {record.note && (
                      <div className="pt-1 text-slate-700 italic flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Note: "{record.note}"</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      {isPayer
                        ? 'Waiting for host/recipient approval'
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
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1.5. Pending Rollback Approvals Section */}
      {rollbackRecords.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-950">Rollback Approvals Requested</h4>
                <p className="text-[11px] text-purple-700">Host requested to reverse payment. Waiting for client approval.</p>
              </div>
            </div>
            <span className="bg-purple-200 text-purple-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {rollbackRecords.length} Rollback Requested
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {rollbackRecords.map((record) => {
              const isPayer = record.fromUserId === currentUserId;
              const isReceiver = record.toUserId === currentUserId;
              const canApproveRollback = isPayer || isAdmin;

              return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl p-4 border border-purple-200/80 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={record.fromUser.name} size="sm" />
                      <span className="text-xs font-bold text-slate-900">
                        {isPayer ? 'You' : record.fromUser.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-xs font-extrabold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                        {formatCurrency(record.amount, currency)}
                      </span>
                      <div className="flex items-center text-[10px] text-purple-700 font-medium mt-0.5">
                        reversal <Undo2 className="w-3 h-3 ml-0.5" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {isReceiver ? 'You' : record.toUser.name}
                      </span>
                      <Avatar name={record.toUser.name} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                      {isPayer
                        ? 'Host requested rollback. Please confirm to reverse this settlement.'
                        : 'Waiting for client approval to reverse settlement'}
                    </span>

                    {canApproveRollback ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectRollback(record.id)}
                          disabled={submittingId === record.id}
                          className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors"
                        >
                          Reject Rollback
                        </button>
                        <button
                          onClick={() => handleApproveRollback(record.id)}
                          disabled={submittingId === record.id}
                          className="px-3 py-1 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Rollback
                        </button>
                      </div>
                    ) : (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                        Pending Client Approval
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
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-xs text-blue-900 leading-relaxed font-medium">
            <span className="font-bold">Debt Optimization Engine:</span> We consolidated all expense shares down to <span className="underline font-bold">{settlements.length}</span> minimal transfer{settlements.length > 1 ? 's' : ''}.
          </p>
        </div>

        {tripId && (
          <button
            onClick={() => handleOpenSettleModal(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Record Settlement / Advance
          </button>
        )}
      </div>

      {/* 3. Calculated Minimal Transfer List */}
      {settlements.length > 0 ? (
        <div className="space-y-3">
          {settlements.map((tx) => {
            const isPayer = tx.fromUser.id === currentUserId;
            const isReceiver = tx.toUser.id === currentUserId;

            // Check if there is already a pending settlement or rollback request for this pair
            const existingPending = pendingRecords.find(
              (r) => r.fromUserId === tx.fromUser.id && r.toUserId === tx.toUser.id
            );
            const existingRollback = rollbackRecords.find(
              (r) => r.fromUserId === tx.fromUser.id && r.toUserId === tx.toUser.id
            );

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-3xl p-4 border transition-all duration-200 apple-shadow space-y-3 ${
                  existingPending
                    ? 'border-amber-200 bg-amber-50/30'
                    : existingRollback
                    ? 'border-purple-200 bg-purple-50/30'
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
                  ) : existingRollback ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1.5 rounded-2xl">
                      <RotateCcw className="w-3.5 h-3.5 text-purple-600" /> Rollback Requested
                    </span>
                  ) : (
                    <button
                      onClick={() => handleOpenSettleModal(tx)}
                      disabled={submittingId === tx.id}
                      className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Settle Up
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
            {confirmedRecords.map((rec) => {
              const canRequestRollback = isAdmin || rec.toUserId === currentUserId;
              const displayAmount = typeof rec.settledAmount === 'number' && rec.settledAmount > 0 ? rec.settledAmount : rec.amount;

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{rec.fromUser.name}</span>
                    <span className="text-slate-400">paid</span>
                    <span className="font-bold text-slate-900">{rec.toUser.name}</span>

                    {rec.paymentMethod === 'WALLET' ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-emerald-600" /> Advance Wallet
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                        Personal Money
                      </span>
                    )}

                    {rec.note && (
                      <span className="text-[11px] text-slate-500 italic bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        "{rec.note}"
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold text-emerald-700">
                      {formatCurrency(displayAmount, currency)}
                    </span>
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        rec.status === 'PARTIALLY_SETTLED'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rec.status === 'PARTIALLY_SETTLED' ? 'Partially Settled' : 'Settled'}
                    </span>

                    {canRequestRollback && (
                      <button
                        onClick={() => setRollbackConfirmId(rec.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors flex items-center gap-1 ml-1"
                        title="Request Rollback / Reversal"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Settlement Audit & History Log */}
      {historyRecords.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-900">Settlement Activity History</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {historyRecords.length} Records
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {historyRecords.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs opacity-75"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 line-through">{rec.fromUser.name}</span>
                  <span className="text-slate-400">paid</span>
                  <span className="font-bold text-slate-700 line-through">{rec.toUser.name}</span>
                  {rec.note && (
                    <span className="text-[10px] text-slate-500 italic">"{rec.note}"</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 line-through">
                    {formatCurrency(rec.amount, currency)}
                  </span>
                  <span
                    className={`font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                      rec.status === 'ROLLED_BACK'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}
                  >
                    {rec.status === 'ROLLED_BACK' ? 'Rolled Back' : 'Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      {tripId && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          tripId={tripId}
          currency={currency}
          transaction={settleModalTx}
          members={members}
          myWallet={myWallet}
          allWallets={allWallets}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Rollback Request Confirmation Modal */}
      {rollbackConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Settlement Rollback</h3>
                <p className="text-xs text-purple-700 font-medium">Two-Sided Safety Action</p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-3.5 text-xs text-purple-900 leading-relaxed">
              <p className="font-bold text-purple-950 mb-1">Are you sure you want to request a rollback?</p>
              A rollback request will be sent to the client (payer). The settlement will only be reversed to unsettled once the client approves.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRollbackConfirmId(null)}
                disabled={submittingId === rollbackConfirmId}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRequestRollback(rollbackConfirmId)}
                disabled={submittingId === rollbackConfirmId}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                {submittingId === rollbackConfirmId ? 'Sending...' : 'Send Rollback Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
