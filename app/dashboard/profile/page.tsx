'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { BottomNav } from '@/components/ui/BottomNav';
import { User, Mail, LogOut, ShieldCheck, Sparkles, ArrowLeft, Heart, Layers } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Trips
          </button>
          <h1 className="text-base font-extrabold text-slate-900">Profile</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Profile Details */}
      <main className="max-w-xl mx-auto px-4 py-6 sm:px-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 apple-shadow text-center space-y-4">
          <Avatar name={user?.name || 'User'} size="xl" className="mx-auto shadow-md" />

          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Verified TripSplit Member
          </div>
        </div>

        {/* System Settings & Information */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            Application Info
          </h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs font-medium">
              <span className="text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> App Version
              </span>
              <span className="font-bold text-slate-900">v2.6 Mobile First</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs font-medium">
              <span className="text-slate-600 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Currency Support
              </span>
              <span className="font-bold text-slate-900">INR (₹), USD ($), EUR (€), THB (฿)</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="danger"
          fullWidth
          size="lg"
          className="flex items-center justify-center gap-2 font-bold"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
