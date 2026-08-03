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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-6 py-2 shadow-lg sm:hidden">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors',
            isDashboard ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[11px]">Trips</span>
        </button>

        <button
          onClick={() => router.push('/dashboard/profile')}
          className={cn(
            'flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-colors',
            isProfile ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px]">Profile</span>
        </button>
      </div>
    </nav>
  );
};
