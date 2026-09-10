'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripSummary, UserSession } from '@/types';
import { TripCard } from '@/components/trip/TripCard';
import { CreateTripModal } from '@/components/trip/CreateTripModal';
import { JoinTripModal } from '@/components/trip/JoinTripModal';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { RenameTripModal } from '@/components/trip/RenameTripModal';
import { TripSettingsModal } from '@/components/trip/TripSettingsModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  KeyRound,
  Compass,
  Search,
  User,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Calendar,
  CheckSquare,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { fetchClientSession, clearClientSession } from '@/lib/clientSession';
import { ExploreResourcesSection } from '@/components/dashboard/ExploreResourcesSection';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserSession | null>(null);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState<TripSummary | null>(null);
  const [renamingTrip, setRenamingTrip] = useState<TripSummary | null>(null);
  const [editingSettingsTrip, setEditingSettingsTrip] = useState<TripSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchTrips = async () => {
    try {
      const meUser = await fetchClientSession();
      if (!meUser) {
        router.push('/login');
        return;
      }
      setUser(meUser);

      try {
        const resTrips = await fetch('/api/trips');
        if (resTrips.status === 401) {
          router.push('/login');
          return;
        }
        if (resTrips.ok) {
          const dataTrips = await resTrips.json();
          setTrips(dataTrips.trips || []);
        }
      } catch (tripsErr) {
        console.error('Failed to fetch trips list:', tripsErr);
      }
    } catch (sessionErr) {
      console.error('Failed to verify client session:', sessionErr);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Real-time unread messages & conversation sorting listener on dashboard
  useEffect(() => {
    if (!trips.length || !user?.id) return;

    const eventSources: EventSource[] = [];

    trips.forEach((t) => {
      try {
        const es = new EventSource(`/api/trips/${t.id}/messages/stream`);
        es.onmessage = (event) => {
          try {
            if (event.data && event.data.startsWith('{')) {
              const newMsg = JSON.parse(event.data);
              if (newMsg.content === '__READ_RECEIPT__') {
                fetchTrips();
                return;
              }

              if (newMsg.senderId !== user.id) {
                setTrips((prevTrips) => {
                  const updated = prevTrips.map((item) => {
                    if (item.id === t.id) {
                      return {
                        ...item,
                        unreadCount: (item.unreadCount || 0) + 1,
                        lastMessage: newMsg,
                      };
                    }
                    return item;
                  });

                  updated.sort((a, b) => {
                    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
                    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                  });

                  return updated;
                });
              }
            }
          } catch (e) {}
        };
        eventSources.push(es);
      } catch (e) {}
    });

    const syncInterval = setInterval(() => {
      fetchTrips();
    }, 3000);

    return () => {
      eventSources.forEach((es) => es.close());
      clearInterval(syncInterval);
    };
  }, [trips.length, user?.id]);

  const handleLogout = async () => {
    clearClientSession();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleConfirmDeleteTrip = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trips/${deletingTrip.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete trip');

      showToast(`Trip "${deletingTrip.name}" deleted permanently.`, 'success');
      setTrips((prev) => prev.filter((t) => t.id !== deletingTrip.id));
      setDeletingTrip(null);
    } catch (err: any) {
      showToast(err.message || 'Error deleting trip', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTrips = React.useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return trips;
    return trips.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
    );
  }, [trips, debouncedQuery]);

  const totalSpentAcrossTrips = React.useMemo(() => {
    return trips.reduce((sum, t) => sum + t.totalExpense, 0);
  }, [trips]);

  const netPortfolioBalance = React.useMemo(() => {
    return trips.reduce((sum, t) => sum + (t.userBalance || 0), 0);
  }, [trips]);

  // Derived recent activity items from active trips
  const recentActivities = React.useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; type: string }> = [];
    trips.forEach((t) => {
      if (t.lastMessage) {
        items.push({
          id: `msg-${t.id}-${t.lastMessage.id}`,
          title: `${t.lastMessage.sender?.name || 'Member'} in ${t.name}`,
          subtitle: t.lastMessage.content === '__READ_RECEIPT__' ? 'Seen messages' : t.lastMessage.content,
          time: new Date(t.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'chat',
        });
      } else {
        items.push({
          id: `trip-${t.id}`,
          title: `Active Trip: ${t.name}`,
          subtitle: `${t.members.length} members • ${formatCurrency(t.totalExpense, t.currency)} spent`,
          time: new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          type: 'trip',
        });
      }
    });
    return items.slice(0, 3);
  }, [trips]);

  // Greeting based on time of day
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleQuickActionTab = (tabKey: string) => {
    if (trips.length > 0) {
      router.push(`/dashboard/trip/${trips[0].id}?tab=${tabKey}`);
    } else {
      setIsCreateOpen(true);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] md:pb-8 max-w-full overflow-x-hidden">
      {/* Sticky App Header - Dark Emerald Glass */}
      <header className="sticky top-0 z-30 bg-[#041911]/85 backdrop-blur-xl border-b border-emerald-500/20 px-3 py-3.5 sm:px-6 shadow-2xl">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-[#04160f] font-black text-sm shadow-md emerald-glow-sm">
              TN
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none">
                TripNizer
              </h1>
              <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">
                {greeting}, <span className="text-white font-bold">{user?.name || 'Explorer'}</span> 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#072a1e]/90 hover:bg-[#0a3828] text-emerald-200 border border-emerald-500/30 px-3 py-2 rounded-2xl transition-all cursor-pointer shadow-sm"
              title="View Profile"
            >
              <User className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-[#072a1e]/90 hover:bg-[#0a3828] text-emerald-200 border border-emerald-500/30 px-3 py-2 rounded-2xl transition-all cursor-pointer shadow-sm"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Join Code
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-[#03140d] px-3.5 py-2 rounded-2xl transition-all cursor-pointer shadow-md emerald-glow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> New Trip
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-2xl transition-all cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl mx-auto px-3 py-5 sm:px-6 space-y-6">
        {/* Dashboard Hero Header */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Trip Command Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-300/80 font-medium">
            Manage your trips, expenses, and plans in one place.
          </p>
        </div>

        {/* Dashboard Hero & Portfolio Overview Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#083023]/95 via-[#06241a]/90 to-[#041811]/95 border border-emerald-500/25 backdrop-blur-2xl shadow-2xl rounded-3xl p-6 sm:p-7 space-y-4">
          {/* Ambient Glow Background */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-400/90 uppercase tracking-widest block">
              Total Expenses Managed
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Auto-Balanced Engine
            </span>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {formatCurrency(totalSpentAcrossTrips, '₹')}
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300/80">Net Position:</span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  netPortfolioBalance > 0.01
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : netPortfolioBalance < -0.01
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-950/60 text-slate-300 border-emerald-800/40'
                }`}
              >
                {netPortfolioBalance === 0
                  ? 'All Settled 🎉'
                  : netPortfolioBalance > 0
                  ? `+${formatCurrency(netPortfolioBalance, '₹')} (Owed)`
                  : `${formatCurrency(netPortfolioBalance, '₹')} (Owe)`}
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs text-slate-300/80 font-medium">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              {trips.length} active trip{trips.length !== 1 ? 's' : ''}
            </span>
            <span>Bilateral Direct Pairwise Settlements</span>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="p-3.5 rounded-2xl bg-[#07281d]/80 hover:bg-[#093527]/95 border border-emerald-500/20 hover:border-emerald-400/40 backdrop-blur-xl text-left transition-all active:scale-[0.98] group cursor-pointer shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-[#03140d] flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform mb-2">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-xs font-extrabold text-white block group-hover:text-emerald-300">
                + New Trip
              </span>
              <span className="text-[10px] text-slate-300/70 font-medium block mt-0.5">
                Start a group trip
              </span>
            </button>

            <button
              onClick={() => setIsJoinOpen(true)}
              className="p-3.5 rounded-2xl bg-[#07281d]/80 hover:bg-[#093527]/95 border border-emerald-500/20 hover:border-emerald-400/40 backdrop-blur-xl text-left transition-all active:scale-[0.98] group cursor-pointer shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white block group-hover:text-emerald-300">
                Join Code
              </span>
              <span className="text-[10px] text-slate-300/70 font-medium block mt-0.5">
                Enter 6-digit code
              </span>
            </button>

            <button
              onClick={() => handleQuickActionTab('tripplan')}
              className="p-3.5 rounded-2xl bg-[#07281d]/80 hover:bg-[#093527]/95 border border-emerald-500/20 hover:border-emerald-400/40 backdrop-blur-xl text-left transition-all active:scale-[0.98] group cursor-pointer shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-950/90 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white block group-hover:text-emerald-300">
                Trip Plan
              </span>
              <span className="text-[10px] text-slate-300/70 font-medium block mt-0.5">
                Itinerary & Stays
              </span>
            </button>

            <button
              onClick={() => handleQuickActionTab('checklist')}
              className="p-3.5 rounded-2xl bg-[#07281d]/80 hover:bg-[#093527]/95 border border-emerald-500/20 hover:border-emerald-400/40 backdrop-blur-xl text-left transition-all active:scale-[0.98] group cursor-pointer shadow-md"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-950/90 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold text-white block group-hover:text-emerald-300">
                Checklist
              </span>
              <span className="text-[10px] text-slate-300/70 font-medium block mt-0.5">
                Packing & tasks
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        {recentActivities.length > 0 && (
          <div className="bg-[#07251b]/80 backdrop-blur-xl rounded-3xl p-5 border border-emerald-500/20 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-tight">Recent Activity</h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">Live Stream</span>
            </div>

            <div className="space-y-2 pt-1">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#051c14]/70 border border-emerald-900/40 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-950/90 text-emerald-400 border border-emerald-500/30 shrink-0">
                      {act.type === 'chat' ? <MessageSquare className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{act.title}</span>
                      <span className="text-[11px] text-slate-300/70 block truncate">{act.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400/80 shrink-0 ml-2">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trips Header & Search Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-white tracking-tight">My Trips</h3>
            <span className="text-xs text-emerald-400/90 font-medium">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>

          {trips.length > 0 && (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-emerald-400/70" />
              <input
                type="text"
                placeholder="Search trip by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#051c14]/90 border border-emerald-500/20 text-white text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 shadow-inner placeholder-emerald-700/60"
              />
            </div>
          )}
        </div>

        {/* Trips Cards List */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-3xl bg-emerald-950/40" />
            <Skeleton className="h-36 w-full rounded-3xl bg-emerald-950/40" />
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                currentUserId={user?.id}
                onRename={(t) => setRenamingTrip(t)}
                onSettings={(t) => setEditingSettingsTrip(t)}
                onDelete={(t) => setDeletingTrip(t)}
              />
            ))}
          </div>
        ) : (
          /* Dark Mode Empty State */
          <div className="bg-[#07251b]/80 rounded-3xl p-8 border border-emerald-500/20 text-center space-y-4 shadow-xl backdrop-blur-xl">
            <div className="w-14 h-14 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner emerald-glow-sm">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-white">No Trips Found</h4>
              <p className="text-xs text-slate-300/80 max-w-xs mx-auto leading-relaxed font-medium">
                {searchQuery
                  ? 'No trip matches your search query.'
                  : 'You are not part of any trip yet. Create a new trip or join using a trip code!'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-[#03140d] font-bold"
              >
                <Plus className="w-4 h-4 mr-1 stroke-[3]" /> Create Trip
              </Button>
              <Button
                onClick={() => setIsJoinOpen(true)}
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/60"
              >
                <KeyRound className="w-4 h-4 mr-1" /> Join Code
              </Button>
            </div>
          </div>
        )}

        {/* Explore & Resources Section */}
        <ExploreResourcesSection />
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={() => setIsCreateOpen(true)}
        className="fixed right-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] z-40 w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 text-[#03140d] rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all sm:hidden cursor-pointer emerald-glow"
        aria-label="Create Trip"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchTrips()}
      />

      <JoinTripModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={() => fetchTrips()}
      />

      {/* Rename Trip Modal */}
      {renamingTrip && (
        <RenameTripModal
          isOpen={!!renamingTrip}
          onClose={() => setRenamingTrip(null)}
          tripId={renamingTrip.id}
          currentName={renamingTrip.name}
          onSuccess={() => fetchTrips()}
        />
      )}

      {/* Trip Settings Modal */}
      {editingSettingsTrip && (
        <TripSettingsModal
          isOpen={!!editingSettingsTrip}
          onClose={() => setEditingSettingsTrip(null)}
          trip={editingSettingsTrip}
          currentUserId={user?.id || ''}
          onSettingsUpdated={() => fetchTrips()}
          onDeleteTrip={(t) => {
            setEditingSettingsTrip(null);
            setDeletingTrip(t);
          }}
        />
      )}

      {/* Delete Trip Confirmation Modal */}
      <Modal
        isOpen={!!deletingTrip}
        onClose={() => setDeletingTrip(null)}
        title={`Delete "${deletingTrip?.name || 'Trip'}"?`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 text-xs text-rose-200">
              <p className="font-extrabold text-rose-300 font-sans uppercase tracking-wide">
                Delete this trip?
              </p>
              <p className="leading-relaxed font-medium">
                This action will permanently remove <span className="font-bold text-white">{deletingTrip?.name}</span> and erase all associated trip data, expenses, settlements, members, and related records.
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/80 pt-1 font-medium">
                <li>Expense logs & receipt uploads</li>
                <li>Debt settlement records & advance credits</li>
                <li>Itinerary, hotel stays & decision polls</li>
                <li>Personal & group trip memories</li>
                <li>Real-time group chat & activity audit trail</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-bold text-center">
            Are you sure you want to proceed? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeleting}
              onClick={() => setDeletingTrip(null)}
              className="text-slate-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDeleteTrip}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm gap-1.5 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting Trip...</span>
                </>
              ) : (
                <span>Permanently Delete Trip</span>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
