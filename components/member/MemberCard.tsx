'use client';

import React from 'react';
import { MemberBalance, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, User } from 'lucide-react';

interface MemberCardProps {
  memberBalance: MemberBalance;
  currency: string;
  isCurrentUser: boolean;
  isAdmin?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  memberBalance,
  currency,
  isCurrentUser,
  isAdmin = false,
}) => {
  const { user, netBalance, paid, share } = memberBalance;

  const getsBack = netBalance > 0;
  const owes = netBalance < 0;

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="md" />

        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-slate-900">
              {user.name} {isCurrentUser ? '(You)' : ''}
            </h4>
            {isAdmin && (
              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Organizer
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Paid {formatCurrency(paid, currency)} • Share {formatCurrency(share, currency)}
          </p>
        </div>
      </div>

      {/* Color-coded Balance Pill */}
      <div className="text-right shrink-0">
        {getsBack && (
          <div className="bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-2xl">
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Gets back</span>
            <span className="text-sm font-extrabold text-emerald-700 block">
              +{formatCurrency(netBalance, currency).replace('+', '')}
            </span>
          </div>
        )}

        {owes && (
          <div className="bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-2xl">
            <span className="text-[11px] font-medium text-rose-600 uppercase tracking-wider block">Owes</span>
            <span className="text-sm font-extrabold text-rose-700 block">
              {formatCurrency(netBalance, currency)}
            </span>
          </div>
        )}

        {!getsBack && !owes && (
          <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">Settled</span>
            <span className="text-sm font-bold text-slate-700 block">{currency}0</span>
          </div>
        )}
      </div>
    </div>
  );
};
