'use client';

import React, { useState } from 'react';
import { SettlementTransaction, TripMemberDetail, UserSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Wallet, ArrowUpRight, ArrowDownLeft, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

interface PersonalDashboardProps {
  currentUserId: string;
  currency: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  settlements: SettlementTransaction[];
  onMarkSettled: (tx: SettlementTransaction) => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = ({
  currentUserId,
  currency,
  totalPaid,
  totalShare,
  netBalance,
  settlements,
  onMarkSettled,
}) => {
  const isNetPositive = netBalance > 0;
  const isNetNegative = netBalance < 0;

  // Incoming settlements (people who owe you)
  const incomingSettlements = settlements.filter((s) => s.toUser.id === currentUserId);
  const totalIncoming = incomingSettlements.reduce((sum, s) => sum + s.amount, 0);

  // Outgoing settlements (people you owe)
  const outgoingSettlements = settlements.filter((s) => s.fromUser.id === currentUserId);
  const totalOutgoing = outgoingSettlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-5">
      {/* 1. Primary "Your Summary" Dashboard Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Your Financial Summary</h3>
              <p className="text-[11px] text-slate-400">Personal breakdown in this trip</p>
            </div>
          </div>

          {/* Net Status Badge */}
          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-extrabold border ${
              isNetPositive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : isNetNegative
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/10 text-slate-300 border-white/20'
            }`}
          >
            {isNetPositive ? 'Receive Money' : isNetNegative ? 'You Owe Money' : 'All Settled'}
          </div>
        </div>

        {/* 3 Metrics Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2 relative z-10">
          {/* You Paid */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300 block">
              You Paid
            </span>
            <span className="text-base font-extrabold text-blue-400 mt-0.5 block">
              {formatCurrency(totalPaid, currency)}
            </span>
          </div>

          {/* Your Share */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Your Share
            </span>
            <span className="text-base font-extrabold text-slate-200 mt-0.5 block">
              {formatCurrency(totalShare, currency)}
            </span>
          </div>

          {/* Net Balance Result */}
          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 block">
              {isNetPositive ? 'To Receive' : isNetNegative ? 'You Owe' : 'Net Balance'}
            </span>
            <span
              className={`text-base font-extrabold mt-0.5 block ${
                isNetPositive
                  ? 'text-emerald-400'
                  : isNetNegative
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {netBalance === 0 ? '₹0' : formatCurrency(netBalance, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. "Who Owes Me?" Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Who Owes Me?</h4>
              <p className="text-[11px] text-slate-400">Incoming payments owed to you</p>
            </div>
          </div>

          {totalIncoming > 0 && (
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-full">
              Incoming: +{formatCurrency(totalIncoming, currency).replace('+', '')}
            </span>
          )}
        </div>

        {incomingSettlements.length > 0 ? (
          <div className="space-y-2 pt-1">
            {incomingSettlements.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={tx.fromUser.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{tx.fromUser.name}</span>
                    <span className="text-[10px] text-slate-500">needs to pay you</span>
                  </div>
                </div>

                <span className="text-sm font-extrabold text-emerald-700">
                  +{formatCurrency(tx.amount, currency).replace('+', '')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2 text-center">No one currently owes you money in this trip.</p>
        )}
      </div>

      {/* 3. "Whom Do I Owe?" Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Whom Do I Owe?</h4>
              <p className="text-[11px] text-slate-400">Outgoing payments you need to clear</p>
            </div>
          </div>

          {totalOutgoing > 0 && (
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold px-3 py-1 rounded-full">
              Outgoing: {formatCurrency(-totalOutgoing, currency)}
            </span>
          )}
        </div>

        {outgoingSettlements.length > 0 ? (
          <div className="space-y-2 pt-1">
            {outgoingSettlements.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/50 border border-rose-100"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={tx.toUser.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pay {tx.toUser.name}</span>
                    <span className="text-[10px] text-slate-500">outstanding debt</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-rose-700">
                    {formatCurrency(-tx.amount, currency)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onMarkSettled(tx)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Settled
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2 text-center">You don't owe money to anyone in this trip!</p>
        )}
      </div>
    </div>
  );
};
