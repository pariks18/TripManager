import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Group Travel Expense App - Fast & Mobile-First Expense Splitter',
  description: 'The easiest group travel expense app for mobile & web. Join with 6-character code, split costs instantly, and minimize debt balances.',
  alternates: {
    canonical: `${baseUrl}/group-travel-expense-app`,
  },
  openGraph: {
    title: 'Group Travel Expense App - Fast & Mobile-First Expense Splitter',
    description: 'Join with 6-character code, split costs instantly, and minimize debt balances.',
    url: `${baseUrl}/group-travel-expense-app`,
    type: 'website',
  },
};

export default function GroupTravelExpenseAppPage() {
  return (
    <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Zap className="w-4 h-4" /> Mobile-First Web Application
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
          Group Travel Expense App
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Designed specifically for friends and families traveling together. Fast, offline-friendly, and accessible from any smartphone browser.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-2">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Instant Trip Code</h3>
          <p className="text-xs text-slate-300">Join a trip in 3 seconds with a 6-character code.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-2">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Equal & Custom Splits</h3>
          <p className="text-xs text-slate-300">Split costs equally or choose exact participating members.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-2">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Secure Data</h3>
          <p className="text-xs text-slate-300">Your trip details and financial balances are 100% private.</p>
        </div>
      </section>

      <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Try TripNizer for Free</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          No download required. Works instantly in any browser.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
        >
          Create Free Trip Account <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
