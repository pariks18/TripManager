'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Calendar, Heart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const pathname = usePathname();
  const router = useRouter();

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
      router.push('/dashboard');
    }
  };

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full px-3 py-1.5 shadow-xl flex items-center justify-around max-w-sm sm:max-w-md w-[94%] sm:w-auto gap-1">
      {/* 1. Live Map */}
      <button
        onClick={() => handleTabClick('location')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer',
          activeTab === 'location'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <MapPin className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Live Map</span>
      </button>

      {/* 2. Trip Plan */}
      <button
        onClick={() => handleTabClick('tripplan')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer',
          activeTab === 'tripplan' || activeTab === 'itinerary' || activeTab === 'stay'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <Calendar className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Trip Plan</span>
      </button>

      {/* 3. Trip Memories */}
      <button
        onClick={() => handleTabClick('memories')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer',
          activeTab === 'memories'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <Heart className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Trip Memories</span>
      </button>

      {/* 4. Profile */}
      <button
        onClick={() => handleTabClick('profile')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all cursor-pointer',
          isProfilePage || activeTab === 'profile'
            ? 'text-emerald-600 font-extrabold scale-105'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <User className="w-4.5 h-4.5" />
        <span className="text-[10px] leading-none">Profile</span>
      </button>
    </nav>
  );
};
