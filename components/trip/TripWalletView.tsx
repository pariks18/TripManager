'use client';

import React, { useEffect, useState } from 'react';
import { TripSummary, TripWalletSummary, UserSession } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ContributeAdvanceModal } from './ContributeAdvanceModal';
import { AddExpenseModal } from '@/components/expense/AddExpenseModal';
import {
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  ShieldCheck,
  FileText,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Info,
  Users,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';

interface TripWalletViewProps {
  tripId: string;
  currency: string;
  isAdmin: boolean;
  currentUserId: string;
  members: TripSummary['members'];
  onOpenSettings?: () => void;
  onRefreshTrip?: () => void;
}

export const TripWalletView: React.FC<TripWalletViewProps> = React.memo(({
  tripId,
  currency,
  isAdmin,
  currentUserId,
  members,
  onOpenSettings,
  onRefreshTrip,
}) => {
  const [walletSummary, setWalletSummary] = useState<TripWalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isAddWalletExpenseOpen, setIsAddWalletExpenseOpen] = useState(false);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchWalletSummary = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load wallet data');
      setWalletSummary(data);
    } catch (err: any) {
      console.error('Wallet fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchWalletSummary();
  }, [tripId]);

  const handleApproveContribution = async (contributionId: string) => {
    setActionId(contributionId);
    try {
      const res = await fetch(`/api/trips/${tripId}/advance/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (!res.ok) throw new Error('Failed to approve advance payment');

      fetchWalletSummary();
      if (onRefreshTrip) onRefreshTrip();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRejectContribution = async (contributionId: string) => {
    const reason = prompt('Rejection reason (optional):');
    setActionId(contributionId);
    try {
      const res = await fetch(`/api/trips/${tripId}/advance/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: reason ? reason.trim() : undefined }),
      });
      if (!res.ok) throw new Error('Failed to reject advance payment');

      fetchWalletSummary();
      if (onRefreshTrip) onRefreshTrip();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  if (isLoading || !walletSummary) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading Trip Wallet & Advance Fund...</p>
      </div>
    );
  }

  const {
    advanceTargetPerMember,
    requireAdvanceVerification,
    totalCollected,
    totalSpent,
    availableBalance,
    memberProgress,
    pendingContributions,
    transactions,
  } = walletSummary;

  const currentMemberProgress = memberProgress.find((m) => m.user.id === currentUserId);

  return (
    <div className="space-y-5">
      {/* 1. Primary Wallet Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Available Wallet Balance */}
        <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 shadow-xl col-span-3 sm:col-span-1 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
              Available Wallet
            </span>
            <div className="p-1.5 bg-emerald-500/20 backdrop-blur-md rounded-xl text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white block">
              {formatCurrency(availableBalance, currency)}
            </span>
            <span className="text-[11px] text-emerald-300/80 font-medium block mt-0.5">
              Ready for advance bookings
            </span>
          </div>
        </div>

        {/* Total Advance Collected */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Collected
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-extrabold text-blue-600 block">
              {formatCurrency(totalCollected, currency)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Approved Pool</span>
          </div>
        </div>

        {/* Total Wallet Spent */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Spent
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg font-extrabold text-purple-600 block">
              {formatCurrency(totalSpent, currency)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Bookings Paid</span>
          </div>
        </div>
      </div>

      {/* 2. Advance Target Banner & Actions */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Advance Trip Fund</h4>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    requireAdvanceVerification
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {requireAdvanceVerification ? 'UTR & Screenshot Required' : 'Simple Pay Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Target per member:{' '}
                <span className="font-bold text-slate-700">
                  {advanceTargetPerMember ? formatCurrency(advanceTargetPerMember, currency) : 'Not set'}
                </span>
              </p>
            </div>
          </div>

          {isAdmin && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              title="Configure Advance Target & Verification Mode"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Contribution Trigger Card for Current Member */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Your Advance Contribution
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Paid:{' '}
              <span className="font-extrabold text-emerald-600">
                {formatCurrency(currentMemberProgress?.paidAmount || 0, currency)}
              </span>{' '}
              • Remaining:{' '}
              <span className="font-extrabold text-rose-600">
                {formatCurrency(currentMemberProgress?.remainingAmount || 0, currency)}
              </span>
            </span>
          </div>

          <Button
            onClick={() => setIsContributeModalOpen(true)}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" /> Pay Advance
          </Button>
        </div>
      </div>

      {/* 3. Super Host Pending Approval Queue */}
      {isAdmin && pendingContributions.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-amber-950">Pending Advance Verification</h4>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {pendingContributions.length} Pending
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {pendingContributions.map((contrib) => (
              <div
                key={contrib.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={contrib.user.name} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {contrib.user.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(contrib.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold text-emerald-700">
                    +{formatCurrency(contrib.amount, currency).replace('+', '')}
                  </span>
                </div>

                {/* UTR & Screenshot Badges */}
                <div className="flex items-center gap-2 text-xs flex-wrap pt-1 border-t border-slate-100">
                  {contrib.utr && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-lg">
                      UTR: {contrib.utr}
                    </span>
                  )}
                  {contrib.screenshotUrl && (
                    <button
                      onClick={() => setPreviewScreenshotUrl(contrib.screenshotUrl!)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      <ImageIcon className="w-3 h-3 text-indigo-600" /> View Screenshot Proof
                    </button>
                  )}
                </div>

                {/* Approve / Reject Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleRejectContribution(contrib.id)}
                    disabled={actionId === contrib.id}
                    className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveContribution(contrib.id)}
                    disabled={actionId === contrib.id}
                    className="px-3.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve & Credit Wallet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Member Advance Progress Breakdown */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Member Advance Contributions</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {memberProgress.length} Members
          </span>
        </div>

        <div className="space-y-3">
          {memberProgress.map((mp) => (
            <div
              key={mp.user.id}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={mp.user.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {mp.user.name} {mp.user.id === currentUserId ? '(You)' : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Paid: {formatCurrency(mp.paidAmount, currency)}
                      {mp.pendingAmount > 0 && (
                        <span className="text-amber-600 font-bold ml-1">
                          ({formatCurrency(mp.pendingAmount, currency)} Pending)
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    {mp.percentagePaid}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Rem: {formatCurrency(mp.remainingAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${mp.percentagePaid}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Trip Wallet Expenses Log */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900">Wallet Bookings & Expenses</h4>
          </div>

          <Button
            onClick={() => setIsAddWalletExpenseOpen(true)}
            disabled={availableBalance <= 0}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Wallet Expense
          </Button>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-2.5">
            {transactions.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                    <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {exp.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Paid from Trip Wallet • Split among {exp.participants?.length || 0} members • {formatDate(exp.createdAt)}
                  </span>
                </div>

                <span className="text-sm font-extrabold text-purple-700">
                  {formatCurrency(exp.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 italic text-xs">
            No expenses paid through the Trip Wallet yet. Click "+ Add Wallet Expense" or select "Trip Wallet" when adding an expense.
          </div>
        )}
      </div>

      {/* Modals */}
      {isContributeModalOpen && (
        <ContributeAdvanceModal
          isOpen={isContributeModalOpen}
          onClose={() => setIsContributeModalOpen(false)}
          tripId={tripId}
          currency={currency}
          requireVerification={requireAdvanceVerification}
          onSuccess={() => {
            fetchWalletSummary();
            if (onRefreshTrip) onRefreshTrip();
          }}
        />
      )}

      {isAddWalletExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddWalletExpenseOpen}
          onClose={() => setIsAddWalletExpenseOpen(false)}
          tripId={tripId}
          currency={currency}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          defaultPaymentSource="WALLET"
          availableWalletBalance={availableBalance}
          onSuccess={() => {
            fetchWalletSummary();
            if (onRefreshTrip) onRefreshTrip();
          }}
        />
      )}

      {/* Screenshot Lightbox Modal */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Payment Screenshot Proof</h4>
              <button
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200">
              <img
                src={previewScreenshotUrl}
                alt="Payment Proof"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
