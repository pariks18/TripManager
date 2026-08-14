'use client';

import React, { useState } from 'react';
import { WalletDetail, TripMemberDetail, UserSummary } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { ContributeModal } from './ContributeModal';
import {
  Wallet,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Sparkles,
  RotateCcw,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  History,
} from 'lucide-react';

interface WalletViewProps {
  tripId: string;
  currency: string;
  wallet?: WalletDetail | null;
  currentUserId: string;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  tripId,
  currency,
  wallet,
  currentUserId,
  isAdmin = false,
  onRefresh,
}) => {
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const balance = wallet?.balance || 0;
  const totalAdded = wallet?.totalAdded || 0;
  const totalSpent = wallet?.totalSpent || 0;

  const contributions = wallet?.contributions || [];
  const transactions = wallet?.transactions || [];

  const pendingContributions = contributions.filter((c) => c.status === 'PENDING');
  const approvedContributions = contributions.filter((c) => c.status === 'APPROVED');

  const handleApproveContribution = async (contributionId: string) => {
    setSubmittingId(contributionId);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve contribution');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve contribution');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectContribution = async (contributionId: string) => {
    setSubmittingId(contributionId);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/contributions/${contributionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject contribution');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reject contribution');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRefundWallet = async () => {
    setIsRefunding(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/refund`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refund wallet balance');

      alert(data.message || 'Remaining wallet balance successfully refunded to contributors!');
      setShowRefundConfirm(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to refund wallet balance');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Wallet Overview Stats Cards */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Wallet className="w-36 h-36" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Group Wallet</h3>
              <p className="text-[11px] text-slate-400">Shared Money Pool Ledger</p>
            </div>
          </div>

          <button
            onClick={() => setIsContributeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Money
          </button>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">Available Wallet Balance</span>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        {/* Breakdown sub-stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Total Added
            </div>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(totalAdded, currency)}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Total Used
            </div>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>

        {/* Refund Trigger for Host */}
        {isAdmin && balance > 0.01 && (
          <div className="pt-2">
            <button
              onClick={() => setShowRefundConfirm(true)}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return / Refund Wallet Balance ({formatCurrency(balance, currency)})
            </button>
          </div>
        )}
      </div>

      {/* 2. Pending Contributions Section (For Host verification) */}
      {pendingContributions.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Pending Contribution Approvals</h4>
                <p className="text-[11px] text-amber-700">Money waiting to be added to group wallet</p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {pendingContributions.length} Pending
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {pendingContributions.map((contrib) => {
              const isContributor = contrib.userId === currentUserId;
              const canApprove = isAdmin;

              return (
                <div
                  key={contrib.id}
                  className="bg-white rounded-2xl p-4 border border-amber-200/80 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={contrib.user.name} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {isContributor ? 'You' : contrib.user.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(contrib.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      +{formatCurrency(contrib.amount, currency)}
                    </span>
                  </div>

                  {contrib.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{contrib.note}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      {isContributor ? 'Waiting for Host approval' : 'Host Verification Required'}
                    </span>

                    {canApprove ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectContribution(contrib.id)}
                          disabled={submittingId === contrib.id}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveContribution(contrib.id)}
                          disabled={submittingId === contrib.id}
                          className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                        Pending Host Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Wallet Transaction History Ledger */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Wallet Transaction History</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-2.5">
            {transactions.map((tx) => {
              const isDeposit = tx.type === 'DEPOSIT';
              const isExpense = tx.type === 'EXPENSE';
              const isRefund = tx.type === 'REFUND';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs transition-all hover:bg-slate-100/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isDeposit
                          ? 'bg-emerald-100 text-emerald-700'
                          : isExpense
                          ? 'bg-rose-100 text-rose-700'
                          : isRefund
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {tx.description || (isDeposit ? 'Wallet Contribution' : isExpense ? 'Expense Paid' : 'Refund')}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                            isDeposit
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExpense
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>By {tx.createdBy.name}</span>
                        <span>•</span>
                        <span>{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold ${
                      isDeposit ? 'text-emerald-600' : isExpense ? 'text-slate-900' : 'text-blue-600'
                    }`}
                  >
                    {isDeposit ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Wallet Transactions Yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Contribute money to the wallet or pay for expenses using group wallet funds to view the ledger history!
            </p>
          </div>
        )}
      </div>

      {/* Modal to Contribute */}
      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        tripId={tripId}
        currency={currency}
        onSuccess={onRefresh}
      />

      {/* Refund Confirmation Modal for Host */}
      {showRefundConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Refund Remaining Wallet Balance</h3>
                <p className="text-xs text-amber-700 font-medium">Proportional Distribution</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed space-y-2">
              <p className="font-bold">
                Are you sure you want to refund the remaining {formatCurrency(balance, currency)} wallet balance?
              </p>
              <p>
                This action will calculate each contributor's proportional share based on their approved contributions, record individual refund transactions, and set the wallet balance to zero.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRefundConfirm(false)}
                disabled={isRefunding}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundWallet}
                disabled={isRefunding}
                className="flex-1 py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                {isRefunding ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
