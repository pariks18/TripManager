'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TripSummary } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TripCardProps {
  trip: TripSummary;
}

export const TripCard: React.FC<TripCardProps> = React.memo(({ trip }) => {
  const router = useRouter();

  const isNetPositive = trip.userBalance > 0;
  const isNetNegative = trip.userBalance < 0;

  return (
    <Card
      interactive
      onClick={() => router.push(`/dashboard/trip/${trip.id}`)}
      className="relative overflow-hidden group border-slate-100/80 hover:border-emerald-200 transition-all duration-300"
    >
      {/* Decorative gradient blur background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 space-y-4">
        {/* Top bar: Name & Trip Code */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {trip.name}
            </h3>
            {trip.description ? (
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{trip.description}</p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Code: <span className="font-mono font-bold tracking-wider text-slate-700">{trip.code}</span></p>
            )}
          </div>

          <span className="shrink-0 bg-slate-100 group-hover:bg-emerald-50 text-slate-700 group-hover:text-emerald-700 text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border border-slate-200/60 transition-colors">
            {trip.code}
          </span>
        </div>

        {/* Middle Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {formatCurrency(trip.totalExpense, trip.currency)}
            </span>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Your Balance</span>
            <span
              className={`text-base font-extrabold mt-0.5 block ${
                isNetPositive
                  ? 'text-emerald-600'
                  : isNetNegative
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {trip.userBalance === 0 ? 'Settled' : formatCurrency(trip.userBalance, trip.currency)}
            </span>
          </div>
        </div>

        {/* Footer: Member avatars & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {trip.members.slice(0, 4).map((m) => (
                <Avatar key={m.id} name={m.user.name} size="sm" className="ring-2 ring-white" />
              ))}
            </div>
            {trip.members.length > 4 && (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                +{trip.members.length - 4}
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium ml-1">
              {trip.members.length} member{trip.members.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
            View Trip <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>
    </Card>
  );
});

