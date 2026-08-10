'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchClientSession } from '@/lib/clientSession';
import { ExpenseDetail, TripSummary, UserSession, CategoryType, MemberBalance, SettlementTransaction } from '@/types';
import { calculateMemberBalances, computeSettlements } from '@/lib/settlement';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ExpenseCard } from '@/components/expense/ExpenseCard';
import { AddExpenseModal } from '@/components/expense/AddExpenseModal';
import { MemberCard } from '@/components/member/MemberCard';
import { PersonalDashboard } from '@/components/trip/PersonalDashboard';

const SettlementList = dynamic(() => import('@/components/settlement/SettlementList').then((m) => m.SettlementList));
const TripTimeline = dynamic(() => import('@/components/trip/TripTimeline').then((m) => m.TripTimeline));
const AnalyticsView = dynamic(() => import('@/components/trip/AnalyticsView').then((m) => m.AnalyticsView));
const PendingApprovalsView = dynamic(() => import('@/components/expense/PendingApprovalsView').then((m) => m.PendingApprovalsView));
const ItineraryView = dynamic(() => import('@/components/trip/ItineraryView').then((m) => m.ItineraryView));
const StayView = dynamic(() => import('@/components/trip/StayView').then((m) => m.StayView));
const TripWalletView = dynamic(() => import('@/components/trip/TripWalletView').then((m) => m.TripWalletView));
const LivePollsView = dynamic(() => import('@/components/trip/LivePollsView').then((m) => m.LivePollsView));
const LiveLocationView = dynamic(() => import('@/components/trip/LiveLocationView').then((m) => m.LiveLocationView));
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomNav } from '@/components/ui/BottomNav';
import { TripBudgetCard } from '@/components/trip/TripBudgetCard';
import { TripSettingsModal } from '@/components/trip/TripSettingsModal';

import {
  ArrowLeft,
  Plus,
  Copy,
  Check,
  Share2,
  Users,
  Receipt,
  ArrowLeftRight,
  Info,
  Search,
  Sparkles,
  Filter,
  History,
  PieChart,
  LayoutDashboard,
  User,
  ShieldCheck,
  Clock,
  Settings,
  Calendar,
  Hotel,
  Wallet,
  Vote,
  Radio,
  MapPin,
} from 'lucide-react';

export default function TripDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.tripId as string;

  const [user, setUser] = useState<UserSession | null>(null);
  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'polls' | 'location' | 'expenses' | 'itinerary' | 'stay' | 'approvals' | 'settlement' | 'timeline' | 'analytics'>('overview');
  const [copiedCode, setCopiedCode] = useState(false);

  // Expense modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDetail | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTripDetails = React.useCallback(async () => {
    try {
      const meUser = await fetchClientSession();
      if (!meUser) {
        router.push('/login');
        return;
      }
      setUser(meUser);

      const resTrip = await fetch(`/api/trips/${tripId}`);
      const dataTrip = await resTrip.json();
      if (!resTrip.ok) {
        router.push('/dashboard');
        return;
      }
      setTrip(dataTrip.trip);
    } catch {
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [tripId, router]);

  useEffect(() => {
    if (tripId) fetchTripDetails();
  }, [tripId, fetchTripDetails]);

  const handleCopyCode = () => {
    if (!trip) return;
    navigator.clipboard.writeText(trip.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExpenseSuccess = React.useCallback((newExpense: ExpenseDetail) => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  const handleDeleteExpense = React.useCallback(async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to delete expense');
        return;
      }
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }, [fetchTripDetails]);

  const handleApproveExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (!res.ok) throw new Error('Failed to approve expense');
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }, [fetchTripDetails]);

  const handleRejectExpense = React.useCallback(async (expenseId: string) => {
    const reason = prompt('Rejection note / reason (optional):');
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: reason ? reason.trim() : undefined }),
      });
      if (!res.ok) throw new Error('Failed to reject expense');
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }, [fetchTripDetails]);

  const handleRequestDeleteExpense = React.useCallback(async (expenseId: string) => {
    if (!confirm('Submit a delete request for this approved expense to the Super Host?')) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}/edit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'DELETE' }),
      });
      if (!res.ok) throw new Error('Failed to submit delete request');
      alert('Delete request submitted! Super Host / Admin will verify.');
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }, [fetchTripDetails]);

  const handleMarkSettled = React.useCallback(async (tx: SettlementTransaction) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: tx.fromUser.id,
          toUserId: tx.toUser.id,
          amount: tx.amount,
          status: 'PENDING',
        }),
      });
      if (!res.ok) throw new Error('Failed to record settlement');
      fetchTripDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }, [tripId, fetchTripDetails]);

  const pendingExpenses = React.useMemo(() => {
    if (!trip) return [];
    return trip.expenses.filter((e) => e.status === 'PENDING_APPROVAL');
  }, [trip?.expenses]);

  const pendingRequests = React.useMemo(() => {
    if (!trip) return [];
    return trip.editRequests?.filter((r) => r.status === 'PENDING') || [];
  }, [trip?.editRequests]);

  const totalPendingCount = pendingExpenses.length + pendingRequests.length;

  const approvedExpenses = React.useMemo(() => {
    if (!trip) return [];
    return trip.expenses.filter((e) => e.status === 'APPROVED');
  }, [trip?.expenses]);

  const balances = React.useMemo(() => {
    if (!trip) return [];
    return calculateMemberBalances(trip.members, approvedExpenses, trip.settlementRecords, trip.advanceContributions);
  }, [trip?.members, approvedExpenses, trip?.settlementRecords, trip?.advanceContributions]);

  const settlements = React.useMemo(() => {
    if (!trip) return [];
    return computeSettlements(trip.members, approvedExpenses, trip.settlementRecords, trip.advanceContributions);
  }, [trip?.members, approvedExpenses, trip?.settlementRecords, trip?.advanceContributions]);

  const filteredExpenses = React.useMemo(() => {
    if (!trip) return [];
    return trip.expenses.filter((exp) => {
      const matchesCategory = selectedCategory === 'ALL' || exp.category === selectedCategory;
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        exp.paidBy?.name.toLowerCase().includes(q) ||
        exp.amount.toString().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [trip?.expenses, selectedCategory, debouncedSearch]);

  if (isLoading || !trip || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const currentMember = trip.members.find((m) => m.userId === user.id);
  const isAdmin = currentMember?.role === 'ADMIN' || trip.createdById === user.id;

  const currentUserBalanceRecord = balances.find((b) => b.user.id === user.id);
  const userTotalPaid = currentUserBalanceRecord?.paid || 0;
  const userTotalShare = currentUserBalanceRecord?.share || 0;
  const userNetBalance = currentUserBalanceRecord?.netBalance || 0;

  const categories: string[] = ['ALL', 'Food', 'Travel', 'Fuel', 'Stay', 'Entertainment', 'Shopping', 'Miscellaneous'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Fixed Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> My Trips
          </button>

          <div className="text-center">
            <h1 className="text-base font-extrabold text-slate-900 line-clamp-1">{trip.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition-colors"
                title="Trip Settings & Verification Toggle"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition-colors"
              title="Profile & Documents"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : trip.code}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-xl mx-auto px-4 py-4 sm:px-8 space-y-5">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center p-1 bg-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 no-scrollbar overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" /> Summary
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Trip Wallet
          </button>

          <button
            onClick={() => setActiveTab('polls')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'polls'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Vote className="w-3.5 h-3.5 text-emerald-600" /> Live Polls
          </button>

          <button
            onClick={() => setActiveTab('location')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'location'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Live Map
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600" /> Expenses ({trip.expenses.length})
          </button>

          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'itinerary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Itinerary
          </button>

          <button
            onClick={() => setActiveTab('stay')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'stay'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <Hotel className="w-3.5 h-3.5 text-pink-600" /> Stay
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeTab === 'approvals'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Approvals
              {totalPendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                  {totalPendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'settlement'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" /> Settlement
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" /> Audit Log
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-teal-600" /> Analytics
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PERSONAL DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <TripBudgetCard
              tripId={trip.id}
              currency={trip.currency}
              budget={trip.budget}
              approvalMode={trip.approvalMode}
              totalSpent={trip.totalExpense}
              isAdmin={isAdmin}
              onBudgetUpdated={fetchTripDetails}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <PersonalDashboard
              currentUserId={user.id}
              currency={trip.currency}
              totalPaid={userTotalPaid}
              totalShare={userTotalShare}
              netBalance={userNetBalance}
              settlements={settlements}
              onMarkSettled={handleMarkSettled}
              memberBalances={balances}
              tripId={trip.id}
              isAdmin={isAdmin}
              onMemberRemoved={fetchTripDetails}
            />
          </div>
        )}

        {/* TAB 2: TRIP WALLET & ADVANCE FUND */}
        {activeTab === 'wallet' && (
          <TripWalletView
            tripId={trip.id}
            currency={trip.currency}
            isAdmin={isAdmin}
            currentUserId={user.id}
            members={trip.members}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onRefreshTrip={fetchTripDetails}
          />
        )}

        {/* TAB 3: LIVE DECISION POLLS */}
        {activeTab === 'polls' && (
          <LivePollsView
            tripId={trip.id}
            isAdmin={isAdmin}
            currentUserId={user.id}
            onRefreshTrip={fetchTripDetails}
          />
        )}

        {/* TAB 4: LIVE GPS LOCATION & MAP */}
        {activeTab === 'location' && (
          <LiveLocationView
            tripId={trip.id}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onRefreshTrip={fetchTripDetails}
          />
        )}

        {/* TAB 2: EXPENSES TIMELINE */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <TripBudgetCard
              tripId={trip.id}
              currency={trip.currency}
              budget={trip.budget}
              approvalMode={trip.approvalMode}
              totalSpent={trip.totalExpense}
              isAdmin={isAdmin}
              onBudgetUpdated={fetchTripDetails}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Search & Category Pills */}
            <div className="space-y-2">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search expense or payer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length > 0 ? (
              <div className="space-y-3">
                {filteredExpenses.map((exp) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    currency={trip.currency}
                    currentUserId={user.id}
                    isAdmin={isAdmin}
                    onEdit={(e) => {
                      setEditingExpense(e);
                      setIsAddExpenseOpen(true);
                    }}
                    onDelete={handleDeleteExpense}
                    onApprove={handleApproveExpense}
                    onReject={handleRejectExpense}
                    onRequestDelete={handleRequestDeleteExpense}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3 apple-shadow">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">No Expenses Recorded</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'No expense matches your filters.'
                    : 'Tap below to log hotel, food, transport or shopping expenses for this trip!'}
                </p>
                <Button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsAddExpenseOpen(true);
                  }}
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add First Expense
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ITINERARY SCHEDULE */}
        {activeTab === 'itinerary' && (
          <ItineraryView
            tripId={trip.id}
            itinerary={trip.itinerary || []}
            isAdmin={isAdmin}
            onRefresh={fetchTripDetails}
          />
        )}

        {/* TAB 4: STAY & ACCOMMODATION */}
        {activeTab === 'stay' && (
          <StayView
            tripId={trip.id}
            stays={trip.stays || []}
            isAdmin={isAdmin}
            onRefresh={fetchTripDetails}
          />
        )}

        {/* TAB 5: PENDING APPROVALS DASHBOARD (ADMIN) */}
        {activeTab === 'approvals' && isAdmin && (
          <PendingApprovalsView
            tripId={trip.id}
            currency={trip.currency}
            pendingExpenses={pendingExpenses}
            pendingRequests={pendingRequests}
            onActionComplete={fetchTripDetails}
          />
        )}

        {/* TAB 4: SETTLEMENT ENGINE */}
        {activeTab === 'settlement' && (
          <SettlementList
            settlements={settlements}
            settlementRecords={trip.settlementRecords}
            currency={trip.currency}
            currentUserId={user.id}
            isAdmin={isAdmin}
            tripId={trip.id}
            onRefresh={fetchTripDetails}
          />
        )}

        {/* TAB 5: AUDIT TIMELINE */}
        {activeTab === 'timeline' && (
          <TripTimeline activities={trip.activities || []} currency={trip.currency} />
        )}

        {/* TAB 6: MEMBER ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView tripId={trip.id} currency={trip.currency} />
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setEditingExpense(null);
          setIsAddExpenseOpen(true);
        }}
        className="fixed right-5 bottom-20 z-40 w-14 h-14 bg-gradient-to-tr from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full flex items-center justify-center shadow-float active:scale-95 transition-all sm:hidden"
        aria-label="Add Expense"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        tripId={trip.id}
        currency={trip.currency}
        members={trip.members}
        currentUserId={user.id}
        isAdmin={isAdmin}
        existingExpense={editingExpense}
        onSuccess={handleExpenseSuccess}
      />

      {/* Trip Settings Modal */}
      <TripSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        tripId={trip.id}
        currency={trip.currency}
        currentApprovalMode={trip.approvalMode}
        currentBudget={trip.budget}
        currentAdvanceTarget={trip.advanceTargetPerMember}
        currentRequireVerification={trip.requireAdvanceVerification}
        onSettingsUpdated={fetchTripDetails}
      />

      <BottomNav />
    </div>
  );
}
