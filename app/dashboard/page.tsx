'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TripSummary, UserSession } from '@/types';
import { TripCard } from '@/components/trip/TripCard';
import { CreateTripModal } from '@/components/trip/CreateTripModal';
import { JoinTripModal } from '@/components/trip/JoinTripModal';
import { BottomNav } from '@/components/ui/BottomNav';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { Plus, KeyRound, Compass, Search, User, LogOut, Wallet, ShieldCheck } from 'lucide-react';
import { fetchClientSession, clearClientSession } from '@/lib/clientSession';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchTrips = async () => {
    try {
      const [meUser, resTrips] = await Promise.all([
        fetchClientSession(),
        fetch('/api/trips'),
      ]);

      if (!meUser) {
        router.push('/login');
        return;
      }
      setUser(meUser);

      const dataTrips = await resTrips.json();
      if (resTrips.ok) {
        setTrips(dataTrips.trips || []);
      }
    } catch {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleLogout = async () => {
    clearClientSession();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Sticky App Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm">
              TS
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
                TripSplit
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Hello, <span className="text-slate-800 font-bold">{user?.name || 'Explorer'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/profile')}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-2xl transition-colors"
              title="View Profile"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setIsJoinOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-2xl transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Join Code
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Trip
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-xl mx-auto px-4 py-5 sm:px-8 space-y-6">
        {/* Total Overview Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Expenses Managed
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Auto-Balanced
            </span>
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {formatCurrency(totalSpentAcrossTrips, '₹')}
          </h2>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{trips.length} active trip{trips.length !== 1 ? 's' : ''}</span>
            <span>All debts consolidated</span>
          </div>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Trip
          </button>
          <button
            onClick={() => setIsJoinOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 px-4 rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
          >
            <KeyRound className="w-4 h-4 text-slate-500" /> Join Code
          </button>
        </div>

        {/* Trips Header & Search Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-900">My Trips</h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'}
            </span>
          </div>

          {trips.length > 0 && (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trip by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Trips Cards List */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">No Trips Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? 'No trip matches your search query.'
                  : 'You are not part of any trip yet. Create a new trip or join using a trip code!'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button onClick={() => setIsCreateOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Create Trip
              </Button>
              <Button onClick={() => setIsJoinOpen(true)} variant="outline" size="sm">
                <KeyRound className="w-4 h-4 mr-1" /> Join Code
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) on Mobile */}
      <button
        onClick={() => setIsCreateOpen(true)}
        className="fixed right-5 bottom-20 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all sm:hidden"
        aria-label="Create Trip"
      >
        <Plus className="w-7 h-7" />
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

      {/* Bottom Nav Bar */}
      <BottomNav />
    </div>
  );
}
