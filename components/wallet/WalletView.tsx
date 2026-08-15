'use client';

import React, { useState } from 'react';
import { UserWalletDetail, TripMemberDetail, WalletAdvanceDetail } from '@/types';
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
  Sparkles,
  RotateCcw,
  ShieldCheck,
  History,
  UserCheck,
} from 'lucide-react';

interface WalletViewProps {
  tripId: string;
  currency: string;
  myWallet?: UserWalletDetail | null;
  allWallets?: UserWalletDetail[];
  members?: TripMemberDetail[];
  currentUserId: string;
  isAdmin?: boolean;
  onRefresh: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  tripId,
  currency,
  myWallet,
  allWallets = [],
  members = [],
  currentUserId,
  isAdmin = false,
  onRefresh,
}) => {
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const balance = myWallet?.balance || 0;
  const totalAdded = myWallet?.totalAdded || 0;
  const totalSpent = myWallet?.totalSpent || 0;

  const myAdvances = myWallet?.advances || [];
  const myTransactions = myWallet?.transactions || [];

  // Collect all pending advance requests across members (for Host verification)
  const pendingAdvances: WalletAdvanceDetail[] = [];
  allWallets.forEach((w) => {
    (w.advances || []).forEach((adv) => {
      if (adv.status === 'PENDING') {
        pendingAdvances.push(adv);
      }
    });
  });

  const handleApproveAdvance = async (advanceId: string) => {
    setSubmittingId(advanceId);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/advances/${advanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve advance request');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to approve advance request');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRejectAdvance = async (advanceId: string) => {
    setSubmittingId(advanceId);
    try {
      const res = await fetch(`/api/trips/${tripId}/wallet/advances/${advanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject advance request');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to reject advance request');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Personal Wallet Overview Card */}
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">My Personal Wallet</h3>
              <p className="text-[11px] text-slate-400">Advance Funds Paid for Trip Expenses</p>
            </div>
          </div>

          <button
            onClick={() => setIsContributeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Advance
          </button>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1">Available Advance Balance</span>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {formatCurrency(balance, currency)}
          </span>
        </div>

        {/* Breakdown sub-stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60">
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" /> Total Advance Added
            </div>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(totalAdded, currency)}
            </span>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> Total Spent
            </div>
            <span className="text-base font-extrabold text-white">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Pending Advances Section (For Host Verification) */}
      {pendingAdvances.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950">Pending Advance Approvals</h4>
                <p className="text-[11px] text-amber-700">Member advances waiting for Host approval</p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
              {pendingAdvances.length} Pending
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {pendingAdvances.map((adv) => {
              const isRequester = adv.userId === currentUserId;
              const canApprove = isAdmin;

              return (
                <div
                  key={adv.id}
                  className="bg-white rounded-2xl p-4 border border-amber-200/80 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={adv.user.name} size="sm" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {isRequester ? 'You' : adv.user.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(adv.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-extrabold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      +{formatCurrency(adv.amount, currency)}
                    </span>
                  </div>

                  {adv.note && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{adv.note}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      {isRequester ? 'Waiting for Host approval' : 'Host Verification Required'}
                    </span>

                    {canApprove ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectAdvance(adv.id)}
                          disabled={submittingId === adv.id}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveAdvance(adv.id)}
                          disabled={submittingId === adv.id}
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

      {/* 3. Members' Personal Wallet Balances Overview */}
      {allWallets.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900">Member Wallet Balances</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">Per-User Advance Balances</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {allWallets.map((w) => {
              const memberInfo = members.find((m) => m.userId === w.userId);
              const name = memberInfo?.user.name || (w.userId === currentUserId ? 'You' : 'Member');
              const isMe = w.userId === currentUserId;

              return (
                <div
                  key={w.id}
                  className={`p-3.5 rounded-2xl border ${
                    isMe ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-100'
                  } flex items-center justify-between`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={name} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {name} {isMe && '(You)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Added: {formatCurrency(w.totalAdded, currency)}
                      </span>
                    </div>
                  </div>

                  <span className={`text-sm font-extrabold ${w.balance > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {formatCurrency(w.balance, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Personal Wallet Transaction Ledger */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">My Wallet History</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {myTransactions.length} Transactions
          </span>
        </div>

        {myTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {myTransactions.map((tx) => {
              const isCredit = tx.type === 'ADVANCE_CREDIT';
              const isDebit = tx.type === 'EXPENSE_DEBIT';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs transition-all hover:bg-slate-100/80"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : isDebit
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isDebit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">
                          {tx.description || (isCredit ? 'Advance Added' : isDebit ? 'Expense Paid' : 'Adjustment')}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-800'
                              : isDebit
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-sm font-extrabold ${
                      isCredit ? 'text-emerald-600' : isDebit ? 'text-rose-600' : 'text-blue-600'
                    }`}
                  >
                    {isCredit ? '+' : isDebit ? '-' : ''}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Transactions Yet</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Add advance money to your personal wallet to use it for expenses!
            </p>
          </div>
        )}
      </div>

      {/* Modal to Add Advance */}
      <ContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        tripId={tripId}
        currency={currency}
        onSuccess={onRefresh}
      />
    </div>
  );
};
