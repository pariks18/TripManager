'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Calendar, CheckSquare, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Guard: BottomNav is exclusively for active Trip contexts (/dashboard/trip/[tripId]) and Profile screen.
  // It must never render on the main Dashboard (/dashboard), root landing, or auth routes.
  if (
    !pathname ||
    pathname === '/dashboard' ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return null;
  }

  const isTripPage = pathname?.startsWith('/dashboard/trip/');
  const isProfilePage = pathname === '/dashboard/profile';

  const handleTabClick = (tabKey: string) => {
    if (tabKey === 'profile') {
      router.push('/dashboard/profile');
      return;
    }

    if (isTripPage && onTabChange) {
      onTabChange(tabKey);
    } else {
      const lastTripId = typeof window !== 'undefined' ? localStorage.getItem('lastTripId') : null;
      if (lastTripId) {
        router.push(`/dashboard/trip/${lastTripId}?tab=${tabKey}`);
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full px-2 sm:px-3 py-1.5 shadow-xl flex items-center justify-between max-w-md sm:max-w-lg w-[96%] sm:w-auto gap-0.5 sm:gap-1 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]">
      {/* 1. Live Map */}
      <button
        onClick={() => handleTabClick('location')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 flex-1',
          activeTab === 'location'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <MapPin className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">Live Map</span>
      </button>

      {/* 2. Trip Plan */}
      <button
        onClick={() => handleTabClick('tripplan')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 flex-1',
          activeTab === 'tripplan' || activeTab === 'itinerary' || activeTab === 'stay'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">Trip Plan</span>
      </button>

      {/* 3. Checklist */}
      <button
        onClick={() => handleTabClick('checklist')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 flex-1',
          activeTab === 'checklist'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <CheckSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">Checklist</span>
      </button>

      {/* 4. Trip Memories */}
      <button
        onClick={() => handleTabClick('memories')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 flex-1',
          activeTab === 'memories'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <Heart className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">Memories</span>
      </button>

      {/* 5. Profile */}
      <button
        onClick={() => handleTabClick('profile')}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 sm:px-3 rounded-2xl transition-all cursor-pointer min-w-0 flex-1',
          isProfilePage || activeTab === 'profile'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="text-[9px] sm:text-[10px] leading-none whitespace-nowrap">Profile</span>
      </button>
    </nav>
  );
};
