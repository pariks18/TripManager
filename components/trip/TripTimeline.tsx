'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ActivityDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import {
  Compass,
  UserPlus,
  Receipt,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Settings,
  PiggyBank,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface TripTimelineProps {
  activities: ActivityDetail[];
  currency: string;
}

const ACTION_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  TRIP_CREATED: { icon: Compass, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
  MEMBER_JOINED: { icon: UserPlus, bg: 'bg-blue-100 dark:bg-blue-950', color: 'text-blue-600' },
  EXPENSE_ADDED: { icon: Receipt, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
  EXPENSE_UPDATED: { icon: Edit2, bg: 'bg-amber-100 dark:bg-amber-950', color: 'text-amber-600' },
  EXPENSE_DELETED: { icon: Trash2, bg: 'bg-rose-100 dark:bg-rose-950', color: 'text-rose-600' },
  EXPENSE_APPROVED: { icon: ShieldCheck, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
  EXPENSE_REJECTED: { icon: ShieldAlert, bg: 'bg-rose-100 dark:bg-rose-950', color: 'text-rose-600' },
  TRIP_UPDATED: { icon: Settings, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
  APPROVAL_MODE_UPDATED: { icon: ShieldCheck, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
  BUDGET_UPDATED: { icon: PiggyBank, bg: 'bg-amber-100 dark:bg-amber-950', color: 'text-amber-600' },
  SETTLEMENT_MARKED: { icon: CheckCircle2, bg: 'bg-purple-100 dark:bg-purple-950', color: 'text-purple-600' },
  SETTLEMENT_CONFIRMED: { icon: Sparkles, bg: 'bg-emerald-100 dark:bg-emerald-950', color: 'text-emerald-600' },
};

export const TripTimeline: React.FC<TripTimelineProps> = React.memo(({ activities, currency }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3 apple-shadow">
        <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
        <h4 className="text-base font-bold text-slate-800">Audit Log Empty</h4>
        <p className="text-xs text-slate-500">Every action performed in this trip will be recorded here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200/80 before:z-0">
      {activities.map((act, index) => {
        const style = ACTION_ICONS[act.actionType] || ACTION_ICONS.TRIP_CREATED;
        const Icon = style.icon;

        return (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="relative z-10 flex items-start gap-3 pl-2"
          >
            {/* Timeline Icon Node */}
            <div className={`p-2.5 rounded-2xl ${style.bg} ${style.color} ring-4 ring-slate-50 shrink-0 shadow-sm`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Event Card */}
            <div className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 apple-shadow space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar name={act.user?.name || 'User'} size="sm" />
                  <span className="text-xs font-bold text-slate-900">{act.user?.name}</span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  {formatRelativeTime(act.createdAt)}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {act.details}
              </p>

              {act.amount !== undefined && act.amount !== null && (
                <div className="pt-1 flex items-center justify-between">
                  {act.category && (
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                      {act.category}
                    </span>
                  )}
                  <span className="text-xs font-mono font-extrabold text-slate-900 ml-auto">
                    {formatCurrency(act.amount, currency)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
