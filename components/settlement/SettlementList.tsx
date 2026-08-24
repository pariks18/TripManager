import React, { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ExpenseDetail, SettlementRecordDetail, SettlementTransaction, TripMemberDetail, UserSummary, UserWalletDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import { SettleUpModal } from './SettleUpModal';
import { ExpenseBreakdownModal } from '@/components/expense/ExpenseBreakdownModal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Receipt,
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
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface SettlementListProps {
  settlements: SettlementTransaction[];
  settlementRecords?: SettlementRecordDetail[];
  currency: string;
  currentUserId: string;
  members?: TripMemberDetail[];
  expenses?: ExpenseDetail[];
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
  expenses = [],
  myWallet,
  allWallets = [],
  isAdmin = false,
  tripId,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [rollbackConfirmId, setRollbackConfirmId] = useState<string | null>(null);

  // Settle Up Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleModalTx, setSettleModalTx] = useState<SettlementTransaction | null>(null);

  // Expense Breakdown Modal State
  const [breakdownMember, setBreakdownMember] = useState<UserSummary | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // Filter settlements strictly from the logged-in user's perspective
  const userSettlements = React.useMemo(() => {
    return settlements.filter((tx) => tx.fromUser.id === currentUserId || tx.toUser.id === currentUserId);
  }, [settlements, currentUserId]);

  const youOweList = React.useMemo(() => {
    return userSettlements.filter((tx) => tx.fromUser.id === currentUserId);
  }, [userSettlements, currentUserId]);

  const youReceiveList = React.useMemo(() => {
    return userSettlements.filter((tx) => tx.toUser.id === currentUserId);
  }, [userSettlements, currentUserId]);

  // Filter settlement history records strictly involving the current user
  const userSettlementRecords = React.useMemo(() => {
    return settlementRecords.filter(
      (r) => r.fromUserId === currentUserId || r.toUserId === currentUserId
    );
  }, [settlementRecords, currentUserId]);

  const pendingRecords = React.useMemo(() => userSettlementRecords.filter((r) => r.status === 'PENDING'), [userSettlementRecords]);
  const rollbackRecords = React.useMemo(() => userSettlementRecords.filter((r) => r.status === 'ROLLBACK_REQUESTED'), [userSettlementRecords]);
  const confirmedRecords = React.useMemo(() => userSettlementRecords.filter((r) => r.status === 'CONFIRMED' || r.status === 'SETTLED' || r.status === 'PARTIALLY_SETTLED' || r.status === 'COMPLETED'), [userSettlementRecords]);
  const historyRecords = React.useMemo(() => userSettlementRecords.filter((r) => r.status !== 'PENDING' && r.status !== 'ROLLBACK_REQUESTED'), [userSettlementRecords]);

  // Financial totals
  const totalOwed = React.useMemo(() => youOweList.reduce((sum, tx) => sum + tx.amount, 0), [youOweList]);
  const totalReceivable = React.useMemo(() => youReceiveList.reduce((sum, tx) => sum + tx.amount, 0), [youReceiveList]);

  const handleCopyPayInfo = (toName: string, amount: number, id: string) => {
    const text = `Hey ${toName}, I am sending ${formatCurrency(amount, currency)} to settle up my share for the trip.`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyReceiveInfo = (fromName: string, amount: number, id: string) => {
    const text = `Hey ${fromName}, please send ${formatCurrency(amount, currency)} to me to settle up our trip expenses.`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSettleModal = (tx: SettlementTransaction | null) => {
    setSettleModalTx(tx);
    setIsSettleModalOpen(true);
  };

  const handleOpenBreakdown = (user: UserSummary) => {
    setBreakdownMember(user);
    setIsBreakdownOpen(true);
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

      showToast('✓ Settlement Approved — Payment completed & finalized', 'success', 'Settlement Approved');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve settlement', 'error', 'Error');
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

      showToast('Settlement Request Rejected', 'info', 'Request Rejected');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject settlement', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const [cancellingSettlementId, setCancellingSettlementId] = useState<string | null>(null);

  const performCancelSettlement = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel settlement');

      showToast('✓ Settlement Request Cancelled', 'info', 'Request Cancelled');

      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel settlement', 'error', 'Error');
    } finally {
      setSubmittingId(null);
      setCancellingSettlementId(null);
    }
  };

  const handleCancelSettlement = (settlementId: string) => {
    setCancellingSettlementId(settlementId);
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

      showToast('Rollback requested', 'info', 'Rollback Requested');
      setRollbackConfirmId(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to request settlement rollback', 'error', 'Error');
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

      showToast('✓ Settlement Rollback Approved', 'success', 'Rollback Approved');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve rollback', 'error', 'Error');
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

      showToast('Rollback request rejected', 'info', 'Rollback Rejected');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject rollback', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const isAllSettled = youOweList.length === 0 && youReceiveList.length === 0;

  return (
    <div className="space-y-6">
      {/* 1. Immediate Financial Position Banner */}
      <div
        className={`rounded-3xl p-6 border transition-all apple-shadow ${
          isAllSettled
            ? 'bg-emerald-50/70 border-emerald-200/80'
            : totalOwed > 0
            ? 'bg-rose-50/60 border-rose-200/80'
            : 'bg-emerald-50/60 border-emerald-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isAllSettled
                    ? 'bg-emerald-100 text-emerald-800'
                    : totalOwed > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isAllSettled
                  ? 'All Settled Up'
                  : totalOwed > 0
                  ? 'Action Required'
                  : 'You Are Owed'}
              </span>
            </div>

            {isAllSettled ? (
              <div>
                <h3 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
                  You're all settled up 🎉
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  You don't owe money to anyone, and no one owes you.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalOwed > 0 ? (
                    <>
                      You need to pay{' '}
                      <span className="text-rose-600 font-black">
                        {formatCurrency(totalOwed, currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      You will receive{' '}
                      <span className="text-emerald-600 font-black">
                        {formatCurrency(totalReceivable, currency)}
                      </span>
                    </>
                  )}
                </h3>
                {totalOwed > 0 && totalReceivable > 0 && (
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    (You are also owed {formatCurrency(totalReceivable, currency)} from others)
                  </p>
                )}
              </div>
            )}
          </div>

          {tripId && (
            <button
              onClick={() => handleOpenSettleModal(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-600" /> Record Settlement / Advance
            </button>
          )}
        </div>
      </div>

      {/* 2. Pending Settlement Approval Requests Section */}
      {pendingRecords.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              Pending Settlement Requests ({pendingRecords.length})
            </h4>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Requires Action
            </span>
          </div>

          <div className="space-y-2.5">
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
                    <div className="flex items-center gap-2.5">
                      <Avatar name={record.fromUser.name} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {isPayer ? 'You' : record.fromUser.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Payer</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {formatCurrency(record.amount, currency)}
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium mt-0.5">paying</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {isReceiver ? 'You' : record.toUser.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">Recipient</span>
                      </div>
                      <Avatar name={record.toUser.name} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      {isPayer ? 'Request sent — waiting for Host' : isReceiver ? 'Confirm payment received' : 'Host Approval Active'}
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
                    ) : isPayer ? (
                      <button
                        onClick={() => handleCancelSettlement(record.id)}
                        disabled={submittingId === record.id}
                        className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Request
                      </button>
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

      {/* 2.5. Pending Rollback Approvals Section */}
      {rollbackRecords.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-sm">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-purple-950">Rollback Approvals Requested</h4>
                <p className="text-[11px] text-purple-700">Host requested to reverse payment. Waiting for approval.</p>
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
                    <div className="flex items-center gap-2.5">
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

                    <div className="flex items-center gap-2.5 text-right">
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
                        : 'Waiting for approval to reverse settlement'}
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

      {/* 3. Section: "You need to pay" */}
      {youOweList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-xl">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              You need to pay
            </h4>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              {youOweList.length} {youOweList.length === 1 ? 'person' : 'people'} to pay
            </span>
          </div>

          <div className="space-y-3">
            {youOweList.map((tx) => {
              const pairPendingRecords = pendingRecords.filter(
                (r) => r.fromUserId === tx.fromUser.id && r.toUserId === tx.toUser.id
              );
              const pendingSum = pairPendingRecords.reduce((sum, r) => sum + r.amount, 0);
              const remainingUnsettled = Math.max(0, Math.round((tx.amount - pendingSum) * 100) / 100);

              const partialTx: SettlementTransaction = {
                ...tx,
                amount: remainingUnsettled > 0 ? remainingUnsettled : tx.amount,
              };

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-3xl p-5 border border-rose-200/80 ring-1 ring-rose-100 transition-all duration-200 apple-shadow space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={tx.toUser.name} size="md" />
                      <div>
                        <h5 className="text-base font-extrabold text-slate-900">
                          You owe <span className="text-rose-600 font-black">{formatCurrency(tx.amount, currency)}</span> to {tx.toUser.name}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Direct debt settlement for trip expenses
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-breakdown of pending and remaining amounts */}
                  {pendingSum > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-amber-900">
                        <span className="font-semibold">Pending Approval:</span>
                        <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          {formatCurrency(pendingSum, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-amber-200/60 font-bold">
                        <span>Remaining Available to Settle:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(remainingUnsettled, currency)}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyPayInfo(tx.toUser.name, remainingUnsettled > 0 ? remainingUnsettled : tx.amount, tx.id)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        {copiedId === tx.id ? 'Copied Note!' : 'Copy Info'}
                      </button>

                      <button
                        onClick={() => handleOpenBreakdown(tx.toUser)}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-rose-600" />
                        View Expenses
                      </button>
                    </div>

                    {remainingUnsettled > 0.01 ? (
                      <button
                        onClick={() => handleOpenSettleModal(partialTx)}
                        disabled={submittingId === tx.id}
                        className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Settle Up {pendingSum > 0 ? formatCurrency(remainingUnsettled, currency) : ''}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-2xl border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Approval
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Section: "You will receive" */}
      {youReceiveList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <ArrowDownLeft className="w-4 h-4" />
              </span>
              You will receive
            </h4>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {youReceiveList.length} {youReceiveList.length === 1 ? 'person' : 'people'} owes you
            </span>
          </div>

          <div className="space-y-3">
            {youReceiveList.map((tx) => {
              const pairPendingRecords = pendingRecords.filter(
                (r) => r.fromUserId === tx.fromUser.id && r.toUserId === tx.toUser.id
              );
              const pendingSum = pairPendingRecords.reduce((sum, r) => sum + r.amount, 0);

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-3xl p-5 border border-emerald-200/80 ring-1 ring-emerald-100 transition-all duration-200 apple-shadow space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={tx.fromUser.name} size="md" />
                      <div>
                        <h5 className="text-base font-extrabold text-slate-900">
                          {tx.fromUser.name} owes you <span className="text-emerald-600 font-black">{formatCurrency(tx.amount, currency)}</span>
                        </h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Owed to you for trip expenses
                        </p>
                      </div>
                    </div>
                  </div>

                  {pendingSum > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-amber-900">
                        <span className="font-semibold">Pending Approval:</span>
                        <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                          {formatCurrency(pendingSum, currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action / Reminder Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyReceiveInfo(tx.fromUser.name, tx.amount, tx.id)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        {copiedId === tx.id ? 'Copied Request Note!' : 'Copy Request'}
                      </button>

                      <button
                        onClick={() => handleOpenBreakdown(tx.fromUser)}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        View Expenses
                      </button>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200">
                      Awaiting payment
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Fully Settled Empty Card (If user owes zero and receives zero) */}
      {isAllSettled && (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-3 apple-shadow">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <h4 className="text-xl font-extrabold text-slate-900">You're all settled up 🎉</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            All your expenses and splits for this trip are completely balanced!
          </p>
        </div>
      )}

      {/* 6. Confirmed Settlement History Section */}
      {confirmedRecords.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Your Settlement History</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {confirmedRecords.length} Settled
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {confirmedRecords.map((rec) => {
              const isPayer = rec.fromUserId === currentUserId;
              const isReceiver = rec.toUserId === currentUserId;
              const canRequestRollback = isAdmin || isReceiver;
              const displayAmount = typeof rec.settledAmount === 'number' && rec.settledAmount > 0 ? rec.settledAmount : rec.amount;

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{isPayer ? 'You' : rec.fromUser.name}</span>
                    <span className="text-slate-400">paid</span>
                    <span className="font-bold text-slate-900">{isReceiver ? 'You' : rec.toUser.name}</span>

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

      {/* 7. Settlement Audit History Log */}
      {historyRecords.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-900">Activity & Reversals</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {historyRecords.length} Records
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {historyRecords.map((rec) => {
              const isPayer = rec.fromUserId === currentUserId;
              const isReceiver = rec.toUserId === currentUserId;

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200 text-xs opacity-75"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 line-through">{isPayer ? 'You' : rec.fromUser.name}</span>
                    <span className="text-slate-400">paid</span>
                    <span className="font-bold text-slate-700 line-through">{isReceiver ? 'You' : rec.toUser.name}</span>
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
              );
            })}
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

      {/* Expense Breakdown Modal */}
      {isBreakdownOpen && (
        <ExpenseBreakdownModal
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          currency={currency}
          currentUserId={currentUserId}
          otherMember={breakdownMember}
          expenses={expenses}
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
              A rollback request will be sent to reverse this settlement.
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

      {/* Cancel Settlement Confirmation Modal */}
      {cancellingSettlementId && (
        <ConfirmModal
          isOpen={!!cancellingSettlementId}
          onClose={() => setCancellingSettlementId(null)}
          title="Cancel Settlement Request"
          message="Are you sure you want to cancel this settlement request? The request will be removed."
          confirmText="Cancel Request"
          variant="danger"
          isLoading={submittingId === cancellingSettlementId}
          onConfirm={() => {
            if (cancellingSettlementId) performCancelSettlement(cancellingSettlementId);
          }}
        />
      )}
    </div>
  );
});
