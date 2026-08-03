'use client';

import React, { useEffect, useState } from 'react';
import { MemberAnalytics } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import { PieChart, TrendingUp, Award, Layers, BarChart2 } from 'lucide-react';

interface AnalyticsViewProps {
  tripId: string;
  currency: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tripId, currency }) => {
  const [analytics, setAnalytics] = useState<MemberAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/trips/${tripId}/analytics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.analytics) setAnalytics(data.analytics);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [tripId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
        <div className="h-20 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <PieChart className="w-4 h-4 text-emerald-600" /> Member Spending & Analytics
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Transparent breakdown of total paid, largest expense logged, and individual trip spending share.
        </p>
      </div>

      <div className="space-y-3">
        {analytics.map((item) => (
          <div
            key={item.user.id}
            className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4"
          >
            {/* Header: Member Avatar & Net Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={item.user.name} size="md" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{item.user.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    Logged {item.expensesAddedCount} expense{item.expensesAddedCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  item.netBalance > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : item.netBalance < 0
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {item.netBalance > 0
                  ? `+${formatCurrency(item.netBalance, currency).replace('+', '')}`
                  : item.netBalance < 0
                  ? formatCurrency(item.netBalance, currency)
                  : 'Settled'}
              </span>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Paid
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {formatCurrency(item.totalPaid, currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Largest Expense
                </span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                  {formatCurrency(item.largestExpenseAmount, currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Top Category
                </span>
                <span className="text-xs font-bold text-purple-700 block mt-0.5 line-clamp-1">
                  {item.mostFrequentCategory}
                </span>
              </div>
            </div>

            {/* Spending Percentage Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Trip Spending Share</span>
                <span className="text-emerald-600 font-bold">{item.percentageSpending}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.percentageSpending, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
