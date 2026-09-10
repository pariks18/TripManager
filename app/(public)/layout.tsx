import React from 'react';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Crawlable Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-tr from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-extrabold text-white text-base shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            TN
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">TripNizer</span>
        </Link>

        {/* Crawlable Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/split-travel-expenses" className="hover:text-emerald-400 transition-colors">
            Split Expenses
          </Link>
          <Link href="/travel-expense-tracker" className="hover:text-emerald-400 transition-colors">
            Expense Tracker
          </Link>
          <Link href="/trip-expense-calculator" className="hover:text-emerald-400 transition-colors">
            Calculator
          </Link>
          <Link href="/group-trip-checklist" className="hover:text-emerald-400 transition-colors">
            Checklist
          </Link>
          <Link href="/group-trip-planner" className="hover:text-emerald-400 transition-colors">
            Planner
          </Link>
          <Link href="/blog" className="hover:text-emerald-400 transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all inline-flex items-center gap-1.5"
            >
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1">{children}</main>

      {/* Crawlable Footer */}
      <footer className="bg-slate-950 border-t border-white/10 text-slate-400 text-xs py-12 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-xs">
                TN
              </div>
              <span className="text-base font-extrabold text-white">TripNizer</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile-first group travel expense splitter & planner. Split expenses, calculate optimal settlements, and manage group checklists with zero math.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Tools & Calculators</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/trip-expense-calculator" className="hover:text-emerald-400 transition-colors">
                  Trip Expense Calculator
                </Link>
              </li>
              <li>
                <Link href="/group-trip-checklist" className="hover:text-emerald-400 transition-colors">
                  Group Trip Checklist Tool
                </Link>
              </li>
              <li>
                <Link href="/split-travel-expenses" className="hover:text-emerald-400 transition-colors">
                  Split Travel Expenses
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">Features & Guides</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/travel-expense-tracker" className="hover:text-emerald-400 transition-colors">
                  Travel Expense Tracker
                </Link>
              </li>
              <li>
                <Link href="/group-trip-planner" className="hover:text-emerald-400 transition-colors">
                  Group Trip Planner
                </Link>
              </li>
              <li>
                <Link href="/group-travel-expense-app" className="hover:text-emerald-400 transition-colors">
                  Group Travel Expense App
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-white text-xs uppercase tracking-wider mb-3">Resources</div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/blog" className="hover:text-emerald-400 transition-colors">
                  Travel Blog & Guides
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Member Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Create Free Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t border-white/5 mt-8 pt-6 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-4">
          <span>© 2026 TripNizer. Designed for effortless group travel.</span>
          <span>Private trip data & expenses are strictly protected.</span>
        </div>
      </footer>
    </div>
  );
}
