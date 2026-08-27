'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SplashPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if session exists
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          router.push('/dashboard');
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-3xl animate-spin blur-lg opacity-60" />
          <div className="absolute inset-0 w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-white font-extrabold text-2xl shadow-2xl">
            TS
          </div>
        </div>
        <h1 className="mt-6 text-xl font-bold text-white tracking-wide">TripSplit</h1>
        <p className="text-xs text-slate-400 mt-1">Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-emerald-500/30">
            TS
          </div>
          <span className="text-xl font-extrabold tracking-tight">TripSplit</span>
        </div>

        <button
          onClick={() => router.push('/login')}
          className="text-xs font-semibold bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Main Hero */}
      <main className="relative z-10 max-w-md mx-auto my-auto py-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" /> Mobile-First Expense Splitter
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Split Trip Expenses <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Without Confusion</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-sm mx-auto">
          One person creates a trip. Everyone joins with a 6-character code. Expenses split automatically. Zero math.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 text-left">
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md space-y-1">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h4 className="text-xs font-bold text-white">Trip Codes</h4>
            <p className="text-[10px] text-slate-400">Join instantly</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md space-y-1">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h4 className="text-xs font-bold text-white">Auto Split</h4>
            <p className="text-[10px] text-slate-400">Equal shares</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md space-y-1">
            <Users className="w-5 h-5 text-amber-400" />
            <h4 className="text-xs font-bold text-white">Min Transfers</h4>
            <p className="text-[10px] text-slate-400">Optimal debt</p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button
            onClick={() => router.push('/register')}
            size="lg"
            fullWidth
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25"
          >
            Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <button
            onClick={() => router.push('/login')}
            className="text-xs text-slate-400 hover:text-white font-medium transition-colors"
          >
            Already have an account? <span className="underline text-emerald-400 font-semibold">Log in</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500">
        Designed for effortless group trips • TripSplit 2026
      </footer>
    </div>
  );
}
