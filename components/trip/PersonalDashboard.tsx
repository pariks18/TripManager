'use client';

import React, { useState } from 'react';
import { ExpenseDetail, MemberBalance, SettlementRecordDetail, SettlementTransaction, TripMemberDetail, UserSummary } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { MemberCard } from '@/components/member/MemberCard';
import { SettleUpModal } from '@/components/settlement/SettleUpModal';
import { ExpenseBreakdownModal } from '@/components/expense/ExpenseBreakdownModal';
import { AdvanceCreditModal } from '@/components/wallet/AdvanceCreditModal';
import { ExpenseCard } from '@/components/expense/ExpenseCard';
import { PersonalBalanceBreakdown } from '@/components/expense/PersonalBalanceBreakdown';
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Receipt,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface PersonalDashboardProps {
  currentUserId: string;
  currency: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number;
  settlements: SettlementTransaction[];
  onMarkSettled: (tx: SettlementTransaction) => void;
  memberBalances?: MemberBalance[];
  settlementRecords?: SettlementRecordDetail[];
  members?: TripMemberDetail[];
  expenses?: ExpenseDetail[];
  tripId?: string;
  tripCreatedById?: string;
  isAdmin?: boolean;
  onMemberRemoved?: () => void;
  onNavigateTab?: (tab: string) => void;
  onAddExpense?: () => void;
  onEditExpense?: (expense: ExpenseDetail) => void;
  onDeleteExpense?: (expenseId: string) => void;
  onApproveExpense?: (expenseId: string) => void;
  onRejectExpense?: (expenseId: string) => void;
}

export const PersonalDashboard: React.FC<PersonalDashboardProps> = React.memo(({
  currentUserId,
  currency,
  totalPaid,
  totalShare,
  netBalance,
  settlements,
  onMarkSettled,
  memberBalances = [],
  settlementRecords = [],
  members = [],
  expenses = [],
  tripId,
  tripCreatedById,
  isAdmin = false,
  onMemberRemoved,
  onNavigateTab,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onApproveExpense,
  onRejectExpense,
}) => {
  const [selectedTx, setSelectedTx] = useState<SettlementTransaction | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Expense breakdown modal state
  const [breakdownMember, setBreakdownMember] = useState<UserSummary | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [isAdvanceCreditOpen, setIsAdvanceCreditOpen] = useState(false);

  const myBalanceRecord = memberBalances.find((b) => b.user.id === currentUserId);

  const isNetPositive = netBalance > 0.01;
  const isNetNegative = netBalance < -0.01;
  const isSettled = !isNetPositive && !isNetNegative;

  // Incoming settlements (people who owe you)
  const incomingSettlements = settlements.filter((s) => s.toUser.id === currentUserId);
  const totalIncoming = incomingSettlements.reduce((sum, s) => sum + s.amount, 0);

  // Outgoing settlements (people you owe)
  const outgoingSettlements = settlements.filter((s) => s.fromUser.id === currentUserId);
  const totalOutgoing = outgoingSettlements.reduce((sum, s) => sum + s.amount, 0);

  // Recent expenses (top 3)
  const recentExpenses = React.useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [expenses]);

  const handleSettleClick = (tx: SettlementTransaction) => {
    if (tripId) {
      setSelectedTx(tx);
      setIsSettleModalOpen(true);
    } else {
      onMarkSettled(tx);
    }
  };

  const handleOpenBreakdown = (user: UserSummary) => {
    setBreakdownMember(user);
    setIsBreakdownOpen(true);
  };

  const currentUserSummary: UserSummary = {
    id: currentUserId,
    name: members.find((m) => m.userId === currentUserId)?.user.name || 'You',
    email: members.find((m) => m.userId === currentUserId)?.user.email || '',
  };

  return (
    <div className="space-y-6">
      {/* 1. Transparent Personal Balance Breakdown */}
      <PersonalBalanceBreakdown
        user={currentUserSummary}
        currency={currency}
        paid={totalPaid}
        share={totalShare}
        netBalance={netBalance}
        expenses={expenses}
        settlementRecords={settlementRecords}
        isCurrentUser={true}
      />

      {/* Quick Action Buttons Row */}
      <div className="flex items-center gap-3">
        {onAddExpense && (
          <button
            onClick={onAddExpense}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        )}

        {outgoingSettlements.length > 0 && (
          <button
            onClick={() => {
              if (onNavigateTab) onNavigateTab('settlement');
              else handleSettleClick(outgoingSettlements[0]);
            }}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settle Up
          </button>
        )}

        <button
          onClick={() => setIsAdvanceCreditOpen(true)}
          className="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-[0.98] text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          💰 Credit: {formatCurrency(myBalanceRecord?.advanceCredit || 0, currency)}
        </button>
      </div>

      {/* 3. Action Items: "Whom Do I Owe?" */}
      {outgoingSettlements.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">You Need to Pay</h4>
                <p className="text-[11px] text-slate-400">Direct debt payments</p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
              {outgoingSettlements.length} {outgoingSettlements.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {outgoingSettlements.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100/80 flex-wrap gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={tx.toUser.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pay {tx.toUser.name}</span>
                    <span className="text-[10px] text-slate-500">outstanding debt</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-rose-600">
                    {formatCurrency(tx.amount, currency)}
                  </span>
                  <button
                    onClick={() => handleOpenBreakdown(tx.toUser)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl shadow-sm transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5 text-rose-600" /> Expenses
                  </button>
                  <Button
                    size="sm"
                    onClick={() => handleSettleClick(tx)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-xl h-8"
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Action Items: "Who Owes Me?" */}
      {incomingSettlements.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">You Will Receive</h4>
                <p className="text-[11px] text-slate-400">Incoming payments</p>
              </div>
            </div>

            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              {incomingSettlements.length} {incomingSettlements.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {incomingSettlements.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100/80 flex-wrap gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={tx.fromUser.name} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{tx.fromUser.name}</span>
                    <span className="text-[10px] text-slate-500">owes you money</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-600">
                    +{formatCurrency(tx.amount, currency).replace('+', '')}
                  </span>
                  <button
                    onClick={() => handleOpenBreakdown(tx.fromUser)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl shadow-sm transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Expenses
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Trip Expenses Preview */}
      {recentExpenses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-sm font-bold text-slate-900">Recent Trip Expenses</h4>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {recentExpenses.map((exp) => (
              <ExpenseCard
                key={exp.id}
                expense={exp}
                currency={currency}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onEdit={onEditExpense || (() => {})}
                onDelete={onDeleteExpense || (() => {})}
                onApprove={onApproveExpense}
                onReject={onRejectExpense}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Trip Members List */}
      {memberBalances.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-900">Trip Members</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {memberBalances.length} Members
            </span>
          </div>

          <div className="space-y-2.5">
            {memberBalances.map((mb) => {
              const memDetail = members.find((m) => m.userId === mb.user.id);
              const isMemAdmin = Boolean(memDetail?.role === 'ADMIN' || (tripCreatedById && mb.user.id === tripCreatedById));
              const isCreator = Boolean(tripCreatedById && mb.user.id === tripCreatedById);

              return (
                <MemberCard
                  key={mb.user.id}
                  memberBalance={mb}
                  currency={currency}
                  isCurrentUser={mb.user.id === currentUserId}
                  isAdmin={isMemAdmin}
                  isCurrentAdmin={isAdmin}
                  isPrimaryCreator={isCreator}
                  tripId={tripId}
                  onMemberRemoved={onMemberRemoved}
                  onRoleUpdated={onMemberRemoved}
                  onViewBreakdown={handleOpenBreakdown}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {tripId && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          tripId={tripId}
          currency={currency}
          transaction={selectedTx}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onSuccess={() => {
            if (onMemberRemoved) onMemberRemoved();
          }}
        />
      )}

      {isBreakdownOpen && (
        <ExpenseBreakdownModal
          isOpen={isBreakdownOpen}
          onClose={() => setIsBreakdownOpen(false)}
          currency={currency}
          currentUserId={currentUserId}
          otherMember={breakdownMember}
          expenses={expenses}
        />
      )}

      {isAdvanceCreditOpen && (
        <AdvanceCreditModal
          isOpen={isAdvanceCreditOpen}
          onClose={() => setIsAdvanceCreditOpen(false)}
          currency={currency}
          currentUserId={currentUserId}
          memberBalance={myBalanceRecord}
          settlementRecords={settlementRecords}
          expenses={expenses}
        />
      )}
    </div>
  );
});
