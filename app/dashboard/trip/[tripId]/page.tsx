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
const LivePollsView = dynamic(() => import('@/components/trip/LivePollsView').then((m) => m.LivePollsView));
const LiveLocationView = dynamic(() => import('@/components/trip/LiveLocationView').then((m) => m.LiveLocationView));
const GroupChatView = dynamic(() => import('@/components/chat/GroupChatView').then((m) => m.GroupChatView));
const TripMemoriesView = dynamic(() => import('@/components/memories/TripMemoriesView').then((m) => m.TripMemoriesView));
const TripChecklistView = dynamic(() => import('@/components/checklist/TripChecklistView').then((m) => m.TripChecklistView));
const AdvanceCreditModal = dynamic(() => import('@/components/wallet/AdvanceCreditModal').then((m) => m.AdvanceCreditModal));
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { BottomNav } from '@/components/ui/BottomNav';
import { TripBudgetCard } from '@/components/trip/TripBudgetCard';
import { TripSettingsModal } from '@/components/trip/TripSettingsModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

import { Modal } from '@/components/ui/Modal';

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
  Lock,
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
  Vote,
  Radio,
  MapPin,
  CreditCard,
  Compass,
  MessageSquare,
  Heart,
  CheckSquare,
} from 'lucide-react';

export default function TripDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = (params?.tripId as string) || '';

  const [user, setUser] = useState<UserSession | null>(null);
  const [trip, setTrip] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'trip' | 'polls' | 'location' | 'expenses' | 'itinerary' | 'stay' | 'approvals' | 'settlement' | 'timeline' | 'analytics' | 'memories' | 'tripplan' | 'checklist'>('overview');
  const [planSubTab, setPlanSubTab] = useState<'itinerary' | 'stay'>('itinerary');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Listen for real-time incoming chat messages when modal is closed
  useEffect(() => {
    if (!tripId) return;

    let lastSeenMsgId: string | null = null;

    // Fetch initial latest message ID on load without setting unread dot
    fetch(`/api/trips/${tripId}/messages?limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          lastSeenMsgId = data.messages[data.messages.length - 1].id;
        }
      })
      .catch(() => {});

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/trips/${tripId}/messages/stream`);
      eventSource.onmessage = (event) => {
        try {
          if (event.data && event.data.startsWith('{')) {
            const newMsg = JSON.parse(event.data);
            if (newMsg.senderId && newMsg.senderId !== user?.id && !isChatModalOpen) {
              if (lastSeenMsgId !== newMsg.id) {
                lastSeenMsgId = newMsg.id;
                setHasUnreadChat(true);
              }
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    // Polling fallback every 2 seconds
    const pollInterval = setInterval(async () => {
      if (isChatModalOpen) return;
      try {
        const res = await fetch(`/api/trips/${tripId}/messages?limit=1`);
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const latest = data.messages[data.messages.length - 1];
          if (lastSeenMsgId && latest.id !== lastSeenMsgId) {
            if (latest.senderId !== user?.id) {
              setHasUnreadChat(true);
            }
          }
          lastSeenMsgId = latest.id;
        }
      } catch (e) {}
    }, 2000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, [tripId, user?.id, isChatModalOpen]);

  // Expense & Advance Credit modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDetail | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdvanceCreditOpen, setIsAdvanceCreditOpen] = useState(false);

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
      const [meUser, resTrip] = await Promise.all([
        fetchClientSession(),
        fetch(`/api/trips/${tripId}`),
      ]);

      if (!meUser) {
        router.push('/login');
        return;
      }
      setUser(meUser);

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

  const { showToast } = useToast();
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm?: () => void;
  }>({ isOpen: false, message: '' });

  const handleCopyCode = () => {
    if (!trip) return;
    navigator.clipboard.writeText(trip.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExpenseSuccess = React.useCallback((newExpense: ExpenseDetail) => {
    setIsAddExpenseOpen(false);
    fetchTripDetails();
  }, [fetchTripDetails]);

  const performDeleteExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to delete expense', 'error', 'Error');
        return;
      }
      showToast('✓ Expense deleted successfully', 'success', 'Expense Deleted');
      fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete expense', 'error', 'Error');
    }
  }, [fetchTripDetails, showToast]);

  const handleDeleteExpense = React.useCallback((expenseId: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action will update group balance calculations.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: () => performDeleteExpense(expenseId),
    });
  }, [performDeleteExpense]);

  const handleApproveExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      if (!res.ok) throw new Error('Failed to approve expense');
      showToast('✓ Expense Approved', 'success', 'Approved');
      fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve expense', 'error', 'Error');
    }
  }, [fetchTripDetails, showToast]);

  const handleRejectExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      if (!res.ok) throw new Error('Failed to reject expense');
      showToast('Expense Request Rejected', 'info', 'Rejected');
      fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject expense', 'error', 'Error');
    }
  }, [fetchTripDetails, showToast]);

  const performRequestDeleteExpense = React.useCallback(async (expenseId: string) => {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/edit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestType: 'DELETE' }),
      });
      if (!res.ok) throw new Error('Failed to submit delete request');
      showToast('✓ Delete request submitted to Super Host', 'info', 'Request Submitted');
      fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit delete request', 'error', 'Error');
    }
  }, [fetchTripDetails, showToast]);

  const handleRequestDeleteExpense = React.useCallback((expenseId: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Request Expense Deletion',
      message: 'Submit a delete request for this approved expense to the Super Host?',
      confirmText: 'Submit Request',
      variant: 'warning',
      onConfirm: () => performRequestDeleteExpense(expenseId),
    });
  }, [performRequestDeleteExpense]);

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
      showToast('✓ Settlement request submitted', 'success', 'Settlement Requested');
      fetchTripDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to record settlement', 'error', 'Error');
    }
  }, [tripId, fetchTripDetails, showToast]);

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
    return calculateMemberBalances(trip.members, approvedExpenses, trip.settlementRecords);
  }, [trip?.members, approvedExpenses, trip?.settlementRecords]);

  const settlements = React.useMemo(() => {
    if (!trip) return [];
    return computeSettlements(trip.members, approvedExpenses, trip.settlementRecords);
  }, [trip?.members, approvedExpenses, trip?.settlementRecords]);

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
  const userAdvanceCredit = Math.max(0, currentUserBalanceRecord?.advanceCredit || 0);

  const categories: string[] = ['ALL', 'Food', 'Travel', 'Fuel', 'Stay', 'Entertainment', 'Shopping', 'Miscellaneous'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Fixed Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-3 sm:px-6">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden xs:inline">My Trips</span>
          </button>

          <div className="text-center min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">{trip.name}</h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-xl transition-colors"
                title="Trip Settings & Verification Toggle"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
            <button
              onClick={() => setIsAdvanceCreditOpen(true)}
              className={`flex items-center gap-1 text-[11px] font-extrabold px-2 py-1 rounded-xl border transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
                userAdvanceCredit > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="View Advance Credit Details"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {userAdvanceCredit > 0
                  ? `+${formatCurrency(userAdvanceCredit, trip.currency)}`
                  : formatCurrency(0, trip.currency)}
              </span>
            </button>
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="flex items-center gap-1 text-[11px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-xl hover:bg-emerald-100 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied!' : trip.code}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-6 space-y-5">
        {/* Primary 4 Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-200/60 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap min-w-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600" /> Summary
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" /> Expenses
          </button>

          <button
            onClick={() => setActiveTab('settlement')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'settlement'
                ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Settle
          </button>

          <button
            onClick={() => setActiveTab('trip')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'trip' || ['approvals', 'timeline', 'analytics'].includes(activeTab)
                ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-600" /> Trip Details
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PERSONAL DASHBOARD */}
        {activeTab === 'overview' && (
          <PersonalDashboard
            currentUserId={user.id}
            currency={trip.currency}
            totalPaid={userTotalPaid}
            totalShare={userTotalShare}
            netBalance={userNetBalance}
            settlements={settlements}
            onMarkSettled={handleMarkSettled}
            memberBalances={balances}
            settlementRecords={trip.settlementRecords}
            members={trip.members}
            expenses={trip.expenses}
            tripId={trip.id}
            isAdmin={isAdmin}
            onMemberRemoved={fetchTripDetails}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
            onAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsAddExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onApproveExpense={handleApproveExpense}
            onRejectExpense={handleRejectExpense}
          />
        )}

        {/* TAB: TRIP DETAILS & FEATURES HUB */}
        {activeTab === 'trip' && (
          <div className="space-y-6">
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

            {/* Trip Features Grid - EXACTLY 3 FEATURES matching mock design */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Trip Details</h4>
                  <p className="text-xs text-slate-400 font-medium">Manage and control your trip</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* 1. Host Approvals */}
                {isAdmin && (
                  <div
                    onClick={() => setActiveTab('approvals')}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-extrabold text-slate-900">Host Approvals</h5>
                          {totalPendingCount > 0 && (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              {totalPendingCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Verify member expenses & requests</p>
                      </div>
                    </div>
                    <span className="text-slate-400 group-hover:text-slate-900 text-lg font-bold">›</span>
                  </div>
                )}

                {/* 2. Analytics */}
                <div
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-105 transition-transform">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900">Analytics</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Spending insights and charts</p>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-900 text-lg font-bold">›</span>
                </div>

                {/* 3. Audit Log */}
                <div
                  onClick={() => setActiveTab('timeline')}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-105 transition-transform">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900">Audit Log</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Activity change history</p>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-900 text-lg font-bold">›</span>
                </div>

                {/* 4. Trip Checklist */}
                <div
                  onClick={() => setActiveTab('checklist')}
                  className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-105 transition-transform">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-slate-900">Trip Checklist</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Group & Personal packing list</p>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-900 text-lg font-bold">›</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Sub-Page Header for Direct Features */}
        {['polls', 'location', 'itinerary', 'stay', 'approvals', 'timeline', 'analytics', 'memories', 'checklist'].includes(activeTab) && (
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <button
              onClick={() => setActiveTab('trip')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Trip Tools
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              {activeTab === 'polls'
                ? 'Live Polls'
                : activeTab === 'location'
                ? 'Live Map'
                : activeTab === 'itinerary'
                ? 'Itinerary'
                : activeTab === 'memories'
                ? 'Trip Memories'
                : activeTab === 'stay'
                ? 'Stay'
                : activeTab === 'approvals'
                ? 'Host Approvals'
                : activeTab === 'timeline'
                ? 'Audit Log'
                : activeTab === 'checklist'
                ? 'Trip Checklist'
                : 'Analytics'}
            </span>
          </div>
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

        {/* TAB: TRIP CHECKLIST */}
        {activeTab === 'checklist' && (
          <TripChecklistView
            tripId={trip.id}
            currentUser={user}
            members={trip.members}
            isAdmin={isAdmin}
          />
        )}

        {/* TAB 2: EXPENSES TIMELINE */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Expenses Tab Header Bar */}
            <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Trip Expenses ({trip.expenses.length})</h3>
                <p className="text-[11px] text-slate-400">Record out-of-pocket spending for group splits</p>
              </div>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsAddExpenseOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>

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

        {/* TAB: TRIP PLAN (ITINERARY + STAY/HOTEL DETAILS) */}
        {(activeTab === 'tripplan' || activeTab === 'itinerary' || activeTab === 'stay') && (
          <div className="space-y-4">
            {/* Trip Plan Top Sub-Tab Switcher */}
            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-1 w-full bg-slate-100/80 p-1 rounded-xl font-bold text-xs">
                <button
                  onClick={() => setPlanSubTab('itinerary')}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    planSubTab === 'itinerary'
                      ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-600" /> Itinerary
                </button>
                <button
                  onClick={() => setPlanSubTab('stay')}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    planSubTab === 'stay'
                      ? 'bg-white text-slate-900 shadow-xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Hotel className="w-4 h-4 text-emerald-600" /> Stay / Hotel
                </button>
              </div>
            </div>

            {planSubTab === 'itinerary' ? (
              <ItineraryView
                tripId={trip.id}
                itinerary={trip.itinerary || []}
                isAdmin={isAdmin}
                onRefresh={fetchTripDetails}
              />
            ) : (
              <StayView
                tripId={trip.id}
                stays={trip.stays || []}
                isAdmin={isAdmin}
                onRefresh={fetchTripDetails}
              />
            )}
          </div>
        )}

        {/* TAB: TRIP MEMORIES & JOURNEY */}
        {activeTab === 'memories' && (
          <TripMemoriesView
            trip={trip}
            currentUser={user}
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
            members={trip.members}
            expenses={trip.expenses}
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

      {/* Floating Group Chat Button */}
      <button
        onClick={() => {
          setIsChatModalOpen(true);
          setHasUnreadChat(false);
          fetch(`/api/trips/${trip.id}/messages/read`, { method: 'POST' }).catch(() => {});
        }}
        className="fixed bottom-20 right-4 sm:right-6 z-40 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-3.5 rounded-full shadow-xl transition-all flex items-center justify-center cursor-pointer group"
        title="Open Group Chat & Live Polls"
      >
        <MessageSquare className="w-6 h-6" />
        {hasUnreadChat && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Group Chat Modal */}
      <Modal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        title=""
        maxWidth="max-w-4xl"
        noPadding
      >
        <GroupChatView
          tripId={trip.id}
          tripName={trip.name}
          currentUser={user}
          isAdmin={isAdmin}
          members={trip.members}
        />
      </Modal>

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
        trip={trip}
        currentUserId={user.id}
        onSettingsUpdated={fetchTripDetails}
        onDeleteTrip={() => {
          setIsSettingsOpen(false);
          setConfirmModalConfig({
            isOpen: true,
            title: `Delete "${trip.name}"?`,
            message: 'Deleting this trip will permanently remove all trip data, expenses, settlements, members, and related records. This action cannot be undone.',
            confirmText: 'Delete Trip',
            variant: 'danger',
            onConfirm: async () => {
              try {
                const res = await fetch(`/api/trips/${trip.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete trip');
                router.push('/dashboard');
              } catch (err: any) {
                showToast(err.message || 'Error deleting trip', 'error');
              }
            },
          });
        }}
      />

      {/* Confirmation & Alert Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        variant={confirmModalConfig.variant}
        onConfirm={confirmModalConfig.onConfirm}
      />

      {/* Advance Credit Modal */}
      {isAdvanceCreditOpen && (
        <AdvanceCreditModal
          isOpen={isAdvanceCreditOpen}
          onClose={() => setIsAdvanceCreditOpen(false)}
          currency={trip.currency}
          currentUserId={user.id}
          memberBalance={currentUserBalanceRecord}
          settlementRecords={trip.settlementRecords}
          expenses={trip.expenses}
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as any)} />
    </div>
  );
}
