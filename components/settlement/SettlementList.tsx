import React, { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { ExpenseDetail, SettlementRecordDetail, SettlementTransaction, TripMemberDetail, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
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
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  ShieldAlert,
  FileText,
  Info,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface SettlementListProps {
  settlements: SettlementTransaction[];
  settlementRecords?: SettlementRecordDetail[];
  currency: string;
  currentUserId: string;
  members?: TripMemberDetail[];
  expenses?: ExpenseDetail[];
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
  isAdmin = false,
  tripId,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Settle Up Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleModalTx, setSettleModalTx] = useState<SettlementTransaction | null>(null);

  // Expense Breakdown Modal State
  const [breakdownMember, setBreakdownMember] = useState<UserSummary | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // Reversal Request Modal State
  const [reversalModalRecord, setReversalModalRecord] = useState<SettlementRecordDetail | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalProofUrl, setReversalProofUrl] = useState('');

  // Decline Reversal Modal State
  const [declineModalRecord, setDeclineModalRecord] = useState<SettlementRecordDetail | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [declineProofUrl, setDeclineProofUrl] = useState('');

  // Host Review Modal State
  const [hostReviewRecord, setHostReviewRecord] = useState<SettlementRecordDetail | null>(null);
  const [hostReason, setHostReason] = useState('');

  // Audit Detail Modal State
  const [auditModalRecord, setAuditModalRecord] = useState<SettlementRecordDetail | null>(null);

  const [cancellingSettlementId, setCancellingSettlementId] = useState<string | null>(null);

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

  // Filter settlement history records strictly involving the current user (or all if admin)
  const userSettlementRecords = React.useMemo(() => {
    if (isAdmin) return settlementRecords;
    return settlementRecords.filter(
      (r) => r.fromUserId === currentUserId || r.toUserId === currentUserId
    );
  }, [settlementRecords, currentUserId, isAdmin]);

  const pendingApprovalRecords = React.useMemo(
    () => userSettlementRecords.filter((r) => r.status === 'PENDING'),
    [userSettlementRecords]
  );

  const pendingReversalRecords = React.useMemo(
    () => userSettlementRecords.filter((r) => r.status === 'PENDING_REVERSAL' || r.status === 'ROLLBACK_REQUESTED'),
    [userSettlementRecords]
  );

  const hostReviewRecords = React.useMemo(
    () => userSettlementRecords.filter((r) => r.status === 'REVERSAL_DECLINED_PENDING_HOST'),
    [userSettlementRecords]
  );

  const historyRecords = React.useMemo(
    () => userSettlementRecords.filter((r) => r.status !== 'PENDING'),
    [userSettlementRecords]
  );

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
        body: JSON.stringify({ action: 'CONFIRM' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve settlement');

      showToast('✓ Settlement Approved', 'success', 'Settlement Approved');
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

  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDecline: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, folder: 'proofs' }),
        });
        const data = await res.json();
        if (res.ok && data.secureUrl) {
          if (isDecline) {
            setDeclineProofUrl(data.secureUrl);
          } else {
            setReversalProofUrl(data.secureUrl);
          }
          showToast('Proof photo uploaded to Cloudinary', 'success');
        } else {
          showToast(data.error || 'Failed to upload proof to Cloudinary', 'error');
        }
      } catch (err) {
        showToast('Failed to upload proof photo', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Reversal Action Handlers
  const handleOpenReversalModal = (rec: SettlementRecordDetail) => {
    setReversalModalRecord(rec);
    setReversalReason('');
    setReversalProofUrl('');
  };

  const handleRequestReversalSubmit = async () => {
    if (!tripId || !reversalModalRecord) return;
    if (!reversalReason.trim()) {
      showToast('A mandatory reason is required to request a reversal.', 'error', 'Missing Reason');
      return;
    }

    setSubmittingId(reversalModalRecord.id);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${reversalModalRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_REVERSAL',
          reason: reversalReason.trim(),
          proofUrl: reversalProofUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reversal');

      showToast('Reversal request submitted to recipient', 'success', 'Reversal Requested');
      setReversalModalRecord(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to request reversal', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleAcceptReversal = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT_REVERSAL' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept reversal');

      showToast('✓ Reversal Approved & Settlement Restored', 'success', 'Reversal Approved');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept reversal', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenDeclineModal = (rec: SettlementRecordDetail) => {
    setDeclineModalRecord(rec);
    setDeclineReason('');
    setDeclineProofUrl('');
  };

  const handleDeclineReversalSubmit = async () => {
    if (!tripId || !declineModalRecord) return;
    if (!declineReason.trim()) {
      showToast('A mandatory reason is required to decline a reversal.', 'error', 'Missing Reason');
      return;
    }

    setSubmittingId(declineModalRecord.id);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${declineModalRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLINE_REVERSAL',
          declineReason: declineReason.trim(),
          proofUrl: declineProofUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decline reversal');

      showToast('Reversal declined. Request escalated to Trip Host.', 'info', 'Escalated to Host');
      setDeclineModalRecord(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to decline reversal', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleHostApproveReversal = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'HOST_APPROVE_REVERSAL',
          hostReason: hostReason.trim() || 'Host Override Approved',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve reversal');

      showToast('✓ Host Override: Reversal Approved', 'success', 'Host Override Approved');
      setHostReviewRecord(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve reversal', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleHostRejectReversal = async (settlementId: string) => {
    if (!tripId) return;
    setSubmittingId(settlementId);
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement/${settlementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'HOST_REJECT_REVERSAL',
          hostReason: hostReason.trim() || 'Host Rejected Reversal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject reversal');

      showToast('Reversal request rejected by Host', 'info', 'Reversal Rejected');
      setHostReviewRecord(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject reversal', 'error', 'Error');
    } finally {
      setSubmittingId(null);
    }
  };

  const isAllSettled = youOweList.length === 0 && youReceiveList.length === 0;

  const renderStatusBadge = (status: SettlementRecordDetail['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-200">Pending Approval</span>;
      case 'PENDING_REVERSAL':
      case 'ROLLBACK_REQUESTED':
        return <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-orange-200">Reversal Requested</span>;
      case 'REVERSAL_DECLINED_PENDING_HOST':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-purple-600" /> Host Review</span>;
      case 'REVERSED':
      case 'ROLLED_BACK':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-200">Reversal Approved</span>;
      case 'REVERSAL_REJECTED':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-slate-200">Reversal Declined</span>;
      case 'CONFIRMED':
      case 'SETTLED':
      case 'COMPLETED':
      default:
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">Completed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Position Banner */}
      <div
        className={`rounded-3xl p-6 border transition-all shadow-sm ${
          isAllSettled
            ? 'bg-white border-slate-200/90'
            : totalOwed > 0
            ? 'bg-rose-50/60 border-rose-200/80'
            : 'bg-emerald-50/60 border-emerald-200/80'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isAllSettled
                  ? 'bg-slate-100 text-slate-700'
                  : totalOwed > 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isAllSettled
                ? 'All Settled Up'
                : totalOwed > 0
                ? 'Payment Required'
                : 'You Are Owed'}
            </span>

            {isAllSettled ? (
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  You're all settled up 🎉
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  You don't owe money to anyone, and no one owes you.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalOwed > 0 ? (
                    <>
                      You need to pay{' '}
                      <span className="text-rose-600">
                        {formatCurrency(totalOwed, currency)}
                      </span>
                    </>
                  ) : (
                    <>
                      You will receive{' '}
                      <span className="text-emerald-600">
                        {formatCurrency(totalReceivable, currency)}
                      </span>
                    </>
                  )}
                </h3>
              </div>
            )}
          </div>

          {tripId && (
            <button
              onClick={() => handleOpenSettleModal(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-sm transition-all shrink-0 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-emerald-600" /> Record Payment / Advance
            </button>
          )}
        </div>
      </div>

      {/* 2. Pending Settlement Approval Requests Section */}
      {pendingApprovalRecords.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              Pending Settlement Approvals ({pendingApprovalRecords.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {pendingApprovalRecords.map((record) => {
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
                        <span className="text-[10px] text-slate-500">Payer</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {formatCurrency(record.amount, currency)}
                      </span>
                      <span className="text-[10px] text-amber-700 font-medium mt-0.5">paying</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {isReceiver ? 'You' : record.toUser.name}
                        </span>
                        <span className="text-[10px] text-slate-500">Recipient</span>
                      </div>
                      <Avatar name={record.toUser.name} size="sm" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {isPayer ? 'Request sent — waiting for Host' : isReceiver ? 'Confirm payment received' : 'Host Approval Active'}
                    </span>

                    {canApprove ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectSettlement(record.id)}
                          disabled={submittingId === record.id}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveSettlement(record.id)}
                          disabled={submittingId === record.id}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    ) : isPayer ? (
                      <button
                        onClick={() => handleCancelSettlement(record.id)}
                        disabled={submittingId === record.id}
                        className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Request
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

      {/* 3. Pending Reversal Requests Section */}
      {pendingReversalRecords.length > 0 && (
        <div className="bg-orange-50/80 border border-orange-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-orange-600 animate-spin" />
              Reversal Requests Pending Review ({pendingReversalRecords.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {pendingReversalRecords.map((record) => {
              const isPayer = record.fromUserId === currentUserId;
              const isReceiver = record.toUserId === currentUserId;

              return (
                <div key={record.id} className="bg-white rounded-2xl p-4 border border-orange-200 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{record.fromUser.name}</span>
                      <span className="text-xs text-slate-400">Paid</span>
                      <span className="font-bold text-xs text-slate-900">{record.toUser.name}</span>
                    </div>

                    <span className="font-extrabold text-sm text-slate-900">
                      {formatCurrency(record.amount, currency)}
                    </span>
                  </div>

                  {record.reversalReason && (
                    <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 text-xs text-orange-950 space-y-0.5">
                      <span className="font-bold block text-[10px] uppercase text-orange-800">Reversal Reason:</span>
                      <p className="font-medium">{record.reversalReason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Status: <span className="font-bold text-orange-700">Reversal Requested</span>
                    </span>

                    {isReceiver || isAdmin ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDeclineModal(record)}
                          disabled={submittingId === record.id}
                          className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                        >
                          Decline Reversal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptReversal(record.id)}
                          disabled={submittingId === record.id}
                          className="px-3.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Reversal
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-semibold italic">
                        Awaiting recipient response
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Host Review Section (Reversals declined by recipient) */}
      {hostReviewRecords.length > 0 && (
        <div className="bg-purple-50/80 border border-purple-200/90 rounded-3xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Host Review & Override Needed ({hostReviewRecords.length})
            </h4>
          </div>

          <div className="space-y-2.5">
            {hostReviewRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl p-4 border border-purple-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900">
                      {record.fromUser.name} → {record.toUser.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Amount: {formatCurrency(record.amount, currency)}
                    </span>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                    Host Review Required
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {record.reversalReason && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-amber-950">
                      <span className="font-bold text-[10px] uppercase block text-amber-800">Requester Reason:</span>
                      <p className="font-medium mt-0.5">{record.reversalReason}</p>
                    </div>
                  )}
                  {record.reversalRecipientReason && (
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200/70 text-rose-950">
                      <span className="font-bold text-[10px] uppercase block text-rose-800">Recipient Decline Reason:</span>
                      <p className="font-medium mt-0.5">{record.reversalRecipientReason}</p>
                    </div>
                  )}
                </div>

                {isAdmin ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setHostReviewRecord(record);
                        setHostReason('');
                      }}
                      className="px-3.5 py-1.5 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Review Reversal
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium italic pt-1 border-t border-slate-100">
                    Under Trip Host review. The organizer will make the final determination.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Section: "You need to pay" */}
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
              {youOweList.length} {youOweList.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="space-y-3">
            {youOweList.map((tx) => {
              const pairPendingRecords = pendingApprovalRecords.filter(
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
                  className="bg-white rounded-3xl p-5 border border-rose-200/80 ring-1 ring-rose-100 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={tx.toUser.name} size="md" />
                      <div>
                        <h5 className="text-base font-extrabold text-slate-900">
                          You owe <span className="text-rose-600 font-black">{formatCurrency(tx.amount, currency)}</span> to {tx.toUser.name}
                        </h5>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Direct debt settlement
                        </p>
                      </div>
                    </div>
                  </div>

                  {pendingSum > 0 && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs space-y-1">
                      <div className="flex justify-between items-center text-amber-900 font-semibold">
                        <span>Pending Approval:</span>
                        <span className="font-extrabold text-amber-700">{formatCurrency(pendingSum, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-amber-200/60 font-bold">
                        <span>Remaining to Settle:</span>
                        <span className="font-mono text-emerald-700">{formatCurrency(remainingUnsettled, currency)}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyPayInfo(tx.toUser.name, remainingUnsettled > 0 ? remainingUnsettled : tx.amount, tx.id)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        {copiedId === tx.id ? 'Copied Note!' : 'Copy Info'}
                      </button>

                      <button
                        onClick={() => handleOpenBreakdown(tx.toUser)}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-rose-600" />
                        View Expenses
                      </button>
                    </div>

                    {remainingUnsettled > 0.01 ? (
                      <button
                        onClick={() => handleOpenSettleModal(partialTx)}
                        disabled={submittingId === tx.id}
                        className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Pay {tx.toUser.name} {pendingSum > 0 ? formatCurrency(remainingUnsettled, currency) : ''}
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

      {/* 6. Section: "You will receive" */}
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
              {youReceiveList.length} {youReceiveList.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="space-y-3">
            {youReceiveList.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-3xl p-5 border border-emerald-200/80 ring-1 ring-emerald-100 shadow-sm space-y-4"
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

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyReceiveInfo(tx.fromUser.name, tx.amount, tx.id)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      {copiedId === tx.id ? 'Copied Note!' : 'Copy Request'}
                    </button>

                    <button
                      onClick={() => handleOpenBreakdown(tx.fromUser)}
                      className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-bold px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      View Expenses
                    </button>
                  </div>

                  {isAdmin ? (
                    <button
                      onClick={() => handleOpenSettleModal(tx)}
                      className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Record Payment
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-2xl border border-emerald-200">
                      Awaiting payment
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Settlement History & Reversals List */}
      {historyRecords.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Settlement & Reversal History</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {historyRecords.length} records
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {historyRecords.map((rec) => {
              const isPayer = rec.fromUserId === currentUserId;
              const isReceiver = rec.toUserId === currentUserId;
              const canRequestReversal =
                (rec.status === 'CONFIRMED' || rec.status === 'SETTLED' || rec.status === 'COMPLETED') &&
                (isPayer || isReceiver || isAdmin);

              const displayAmount = typeof rec.settledAmount === 'number' && rec.settledAmount > 0 ? rec.settledAmount : rec.amount;

              return (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900">{isPayer ? 'You' : rec.fromUser.name}</span>
                      <span className="text-slate-400 font-medium">paid</span>
                      <span className="font-extrabold text-slate-900">{isReceiver ? 'You' : rec.toUser.name}</span>
                      <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {formatCurrency(displayAmount, currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">{formatDate(rec.createdAt)}</span>
                      {renderStatusBadge(rec.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setAuditModalRecord(rec)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-slate-500" /> Audit Log
                    </button>

                    {canRequestReversal && (
                      <button
                        type="button"
                        onClick={() => handleOpenReversalModal(rec)}
                        className="px-3 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-rose-600" /> Request Reversal
                      </button>
                    )}
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

      {/* 1. Request Reversal Modal */}
      <Modal
        isOpen={!!reversalModalRecord}
        onClose={() => setReversalModalRecord(null)}
        title="Request Settlement Reversal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              This request will be sent to the payment recipient for approval. The original settlement will remain active until reviewed.
            </p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-slate-400 font-medium">Settlement Amount:</span>
            <p className="text-base font-extrabold text-slate-900">
              {formatCurrency(reversalModalRecord?.amount || 0, currency)} ({reversalModalRecord?.fromUser.name} → {reversalModalRecord?.toUser.name})
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Mandatory Reversal Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explain why this settlement needs to be reversed..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Supporting Proof / Receipt URL (Optional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL or pick file"
                value={reversalProofUrl}
                onChange={(e) => setReversalProofUrl(e.target.value)}
              />
              <label className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer border border-slate-200 shrink-0 flex items-center gap-1">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleProofFileUpload(e, false)}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setReversalModalRecord(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRequestReversalSubmit}
              disabled={submittingId === reversalModalRecord?.id}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Submit Reversal Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Decline Reversal Modal */}
      <Modal
        isOpen={!!declineModalRecord}
        onClose={() => setDeclineModalRecord(null)}
        title="Decline Reversal Request"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            If you decline this reversal, the request will be submitted to the Trip Host/Organizer for final review.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Mandatory Decline Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State your reason for declining this reversal..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium text-slate-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Supporting Proof URL (Optional)</label>
            <Input
              placeholder="Paste proof image URL"
              value={declineProofUrl}
              onChange={(e) => setDeclineProofUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setDeclineModalRecord(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeclineReversalSubmit}
              disabled={submittingId === declineModalRecord?.id}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
            >
              Decline & Escalate to Host
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Host Review Modal */}
      <Modal
        isOpen={!!hostReviewRecord}
        onClose={() => setHostReviewRecord(null)}
        title="Host Review: Settlement Reversal"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between font-bold text-purple-950">
              <span>Settlement: {formatCurrency(hostReviewRecord?.amount || 0, currency)}</span>
              <span>{hostReviewRecord?.fromUser.name} → {hostReviewRecord?.toUser.name}</span>
            </div>

            {hostReviewRecord?.reversalReason && (
              <div className="pt-2 border-t border-purple-200/60">
                <span className="font-extrabold uppercase text-[10px] text-amber-800 block">Requester Reason:</span>
                <p className="font-medium text-slate-800 mt-0.5">{hostReviewRecord.reversalReason}</p>
              </div>
            )}

            {hostReviewRecord?.reversalRecipientReason && (
              <div className="pt-2 border-t border-purple-200/60">
                <span className="font-extrabold uppercase text-[10px] text-rose-800 block">Recipient Decline Reason:</span>
                <p className="font-medium text-slate-800 mt-0.5">{hostReviewRecord.reversalRecipientReason}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Host Note / Override Justification</label>
            <textarea
              rows={2}
              placeholder="Add host decision note..."
              value={hostReason}
              onChange={(e) => setHostReason(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              onClick={() => hostReviewRecord && handleHostRejectReversal(hostReviewRecord.id)}
              disabled={submittingId === hostReviewRecord?.id}
              variant="outline"
              className="text-xs font-bold"
            >
              Reject Reversal
            </Button>
            <Button
              type="button"
              onClick={() => hostReviewRecord && handleHostApproveReversal(hostReviewRecord.id)}
              disabled={submittingId === hostReviewRecord?.id}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm gap-1"
            >
              <ShieldCheck className="w-4 h-4" /> Approve Reversal (Host Override)
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Full Audit Log Modal */}
      <Modal
        isOpen={!!auditModalRecord}
        onClose={() => setAuditModalRecord(null)}
        title="Settlement Audit History"
        maxWidth="max-w-md"
      >
        <div className="space-y-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Record ID:</span>
              <span className="font-mono text-[10px] text-slate-700">{auditModalRecord?.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Original Amount:</span>
              <span className="font-extrabold text-slate-900">{formatCurrency(auditModalRecord?.amount || 0, currency)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Payer → Recipient:</span>
              <span className="font-bold text-slate-800">{auditModalRecord?.fromUser.name} → {auditModalRecord?.toUser.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Status:</span>
              {auditModalRecord && renderStatusBadge(auditModalRecord.status)}
            </div>
          </div>

          {auditModalRecord?.reversalReason && (
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 space-y-1">
              <span className="font-bold text-[10px] text-amber-800 uppercase block">Reversal Request Reason</span>
              <p className="font-medium text-amber-950">{auditModalRecord.reversalReason}</p>
              {auditModalRecord.reversalProofUrl && (
                <a href={auditModalRecord.reversalProofUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center gap-1 pt-1">
                  <ExternalLink className="w-3 h-3" /> View Attachment
                </a>
              )}
            </div>
          )}

          {auditModalRecord?.reversalRecipientReason && (
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 space-y-1">
              <span className="font-bold text-[10px] text-rose-800 uppercase block">Recipient Decline Reason</span>
              <p className="font-medium text-rose-950">{auditModalRecord.reversalRecipientReason}</p>
            </div>
          )}

          {auditModalRecord?.reversalHostReason && (
            <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-bold text-[10px] text-purple-800 uppercase block">Host Decision Note ({auditModalRecord.reversalHostDecision})</span>
              <p className="font-medium text-purple-950">{auditModalRecord.reversalHostReason}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setAuditModalRecord(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Settlement Confirmation Modal */}
      {cancellingSettlementId && (
        <ConfirmModal
          isOpen={!!cancellingSettlementId}
          onClose={() => setCancellingSettlementId(null)}
          title="Cancel Settlement Request"
          message="Are you sure you want to cancel this settlement request?"
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
