import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Split Travel Expenses with Friends - Fast & Fair Expense Splitter',
  description: 'How to split travel expenses with friends. Calculate equal or custom room, food, and transport shares with minimal balance transfers.',
  alternates: {
    canonical: `${baseUrl}/split-travel-expenses`,
  },
  openGraph: {
    title: 'Split Travel Expenses with Friends - Fast & Fair Expense Splitter',
    description: 'Calculate equal or custom room, food, and transport shares with minimal balance transfers.',
    url: `${baseUrl}/split-travel-expenses`,
    type: 'website',
  },
};

export default function SplitTravelExpensesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Split Travel Expenses on a Group Trip',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Create a Trip Code',
        text: 'Create a trip in TripNizer and share the 6-character code with your group.',
      },
      {
        '@type': 'HowToStep',
        name: 'Log Shared Expenses',
        text: 'Each member inputs payments for hotels, meals, or rentals as they occur.',
      },
      {
        '@type': 'HowToStep',
        name: 'View Debt Settlements',
        text: 'TripNizer calculates exact net balances and minimum balance transfers.',
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <CreditCard className="w-4 h-4" /> Group Expense Splitting Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Split Travel Expenses with Friends
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Eliminate awkward money conversations. Keep your group trip fair, transparent, and debt-free.
          </p>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-xl font-bold text-white">3 Simple Steps to Split Vacation Costs</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <span className="text-emerald-400 font-extrabold text-xl">01</span>
              <h3 className="text-base font-bold text-white">Create & Join</h3>
              <p className="text-xs text-slate-300">
                One member creates the trip. Friends join instantly with a 6-character code.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-emerald-400 font-extrabold text-xl">02</span>
              <h3 className="text-base font-bold text-white">Log Expenses</h3>
              <p className="text-xs text-slate-300">
                Log purchases on mobile. Support for unjoined friends who haven’t created an account yet.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-emerald-400 font-extrabold text-xl">03</span>
              <h3 className="text-base font-bold text-white">Optimal Settlement</h3>
              <p className="text-xs text-slate-300">
                TripNizer computes the minimum debt transfers so settlements take 1-2 easy payments.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Ready to Split Your Next Trip?</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Get started in under 60 seconds with zero credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Start Free Trip <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
