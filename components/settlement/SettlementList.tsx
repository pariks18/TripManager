'use client';

import React, { useState } from 'react';
import { SettlementTransaction } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Copy, Sparkles, Wallet } from 'lucide-react';

interface SettlementListProps {
  settlements: SettlementTransaction[];
  currency: string;
  currentUserId: string;
}

export const SettlementList: React.FC<SettlementListProps> = ({
  settlements,
  currency,
  currentUserId,
}) => {
  const [settledIds, setSettledIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleSettled = (id: string) => {
    if (settledIds.includes(id)) {
      setSettledIds(settledIds.filter((item) => item !== id));
    } else {
      setSettledIds([...settledIds, id]);
    }
  };

  const handleCopyUPI = (tx: SettlementTransaction) => {
    const text = `Hey ${tx.fromUser.name}, please pay ${formatCurrency(tx.amount, currency)} to ${tx.toUser.name} for the trip settlement.`;
    navigator.clipboard.writeText(text);
    setCopiedId(tx.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (settlements.length === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-8 text-center space-y-3">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-emerald-900">Everyone is All Settled Up!</h4>
        <p className="text-xs text-emerald-700 max-w-xs mx-auto">
          No remaining debts exist for this trip. Outstanding balances are perfectly zero!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-4 flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl shrink-0">
          <Wallet className="w-5 h-5" />
        </div>
        <p className="text-xs text-blue-900 leading-relaxed font-medium">
          <span className="font-bold">Debt Optimization Active:</span> We reduced total transfer transactions down to <span className="underline font-bold">{settlements.length}</span> payment{settlements.length > 1 ? 's' : ''}.
        </p>
      </div>

      <div className="space-y-3">
        {settlements.map((tx) => {
          const isSettled = settledIds.includes(tx.id);
          const isPayer = tx.fromUser.id === currentUserId;
          const isReceiver = tx.toUser.id === currentUserId;

          return (
            <div
              key={tx.id}
              className={`bg-white rounded-3xl p-4 border transition-all duration-200 apple-shadow space-y-3 ${
                isSettled
                  ? 'opacity-60 bg-slate-50 border-slate-200'
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
                  onClick={() => handleCopyUPI(tx)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold px-2.5 py-1 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === tx.id ? 'Copied Details!' : 'Copy Payment Info'}
                </button>

                <button
                  onClick={() => toggleSettled(tx.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl transition-all ${
                    isSettled
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSettled ? 'Settled' : 'Mark as Settled'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
