'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, User, PlusCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard = pathname === '/dashboard';
  const isProfile = pathname === '/dashboard/profile';

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-full px-8 py-2 shadow-xl flex items-center justify-center gap-8 max-w-xs w-[92%] sm:w-auto">
      <button
        onClick={() => router.push('/dashboard')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all',
          isDashboard ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[11px]">Trips</span>
      </button>

      <button
        onClick={() => router.push('/dashboard/profile')}
        className={cn(
          'flex flex-col items-center gap-0.5 py-1 px-4 rounded-2xl transition-all',
          isProfile ? 'text-emerald-600 font-extrabold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
        )}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px]">Profile</span>
      </button>
    </nav>
  );
};
