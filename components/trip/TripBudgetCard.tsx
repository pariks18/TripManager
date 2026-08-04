'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PiggyBank, AlertTriangle, AlertCircle, Edit3, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface TripBudgetCardProps {
  tripId: string;
  currency: string;
  budget?: number | null;
  totalSpent: number;
  isAdmin: boolean;
  onBudgetUpdated: () => void;
}

export const TripBudgetCard: React.FC<TripBudgetCardProps> = ({
  tripId,
  currency,
  budget,
  totalSpent,
  isAdmin,
  onBudgetUpdated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetValue, setBudgetValue] = useState(budget ? budget.toString() : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasBudget = budget !== null && budget !== undefined && budget > 0;
  const percentage = hasBudget ? Math.min(Math.round((totalSpent / budget!) * 100), 200) : 0;
  const remaining = hasBudget ? budget! - totalSpent : 0;

  const isOverBudget = hasBudget && totalSpent > budget!;
  const isWarning = hasBudget && percentage >= 80 && !isOverBudget;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: budgetValue }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update trip budget');
      }

      onBudgetUpdated();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2.5 rounded-2xl ${
                isOverBudget
                  ? 'bg-rose-100 text-rose-700'
                  : isWarning
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trip Budget & Tracking</h3>
              <p className="text-[11px] text-slate-400 font-medium">Real-time overspending monitor</p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => {
                setBudgetValue(budget ? budget.toString() : '');
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-2xl transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {hasBudget ? 'Edit Budget' : 'Set Budget'}
            </button>
          ) : (
            hasBudget && (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Budget: {formatCurrency(budget!, currency)}
              </span>
            )
          )}
        </div>

        {hasBudget ? (
          <div className="space-y-3">
            {/* Real-time Overspending Alert Banners */}
            {isOverBudget && (
              <div className="p-3.5 bg-rose-50 border border-rose-200/90 rounded-2xl flex items-start gap-3 animate-pulse">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800">🚨 Overspending Alert!</h4>
                  <p className="text-xs font-medium text-rose-700 mt-0.5">
                    Trip spending has exceeded the budget by{' '}
                    <strong>{formatCurrency(Math.abs(remaining), currency)}</strong> ({percentage}% used).
                  </p>
                </div>
              </div>
            )}

            {isWarning && (
              <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-800">⚠️ High Spending Warning</h4>
                  <p className="text-xs font-medium text-amber-700 mt-0.5">
                    You have used <strong>{percentage}%</strong> of the trip budget. Remaining:{' '}
                    <strong>{formatCurrency(remaining, currency)}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Budget
                </span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  {formatCurrency(budget!, currency)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Spent
                </span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                  {formatCurrency(totalSpent, currency)}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-2xl">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Remaining
                </span>
                <span
                  className={`text-sm font-extrabold mt-0.5 block ${
                    remaining < 0 ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  {remaining < 0
                    ? `-${formatCurrency(Math.abs(remaining), currency)}`
                    : formatCurrency(remaining, currency)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Budget Progress</span>
                <span className="font-bold text-slate-900">{percentage}%</span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverBudget
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-2">
            <TrendingUp className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Trip Budget Set</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {isAdmin
                ? 'Set a trip budget to track overspending and send real-time alerts to members.'
                : 'The Super Host has not set a total budget for this trip yet.'}
            </p>
            {isAdmin && (
              <Button onClick={() => setIsModalOpen(true)} size="sm" className="mt-1">
                Set Trip Budget
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Set/Edit Budget Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Set Total Trip Budget"
        >
          <form onSubmit={handleSaveBudget} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Total Budget Amount ({currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 50000"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-lg font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave empty to remove budget limit.</p>
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                Save Budget
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
