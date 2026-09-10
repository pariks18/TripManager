import type { Metadata } from 'next';
import { InteractiveCalculator } from '@/components/seo/InteractiveCalculator';
import Link from 'next/link';
import { ArrowRight, Calculator } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Trip Expense Calculator - Calculate & Split Group Vacation Costs',
  description: 'Free online trip expense calculator. Calculate per-person shares, hotel splits, and debt balances instantly for any group vacation.',
  alternates: {
    canonical: `${baseUrl}/trip-expense-calculator`,
  },
  openGraph: {
    title: 'Trip Expense Calculator - Calculate & Split Group Costs',
    description: 'Free online trip expense calculator. Split hotel room costs and calculate balance transfers instantly.',
    url: `${baseUrl}/trip-expense-calculator`,
    type: 'website',
  },
};

export default async function TripExpenseCalculatorPage() {
  const user = await getSessionUser();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Trip Expense Calculator',
    operatingSystem: 'All browsers',
    applicationCategory: 'UtilityApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Calculate group trip expense division and balance settlements.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <Calculator className="w-4 h-4" /> Free Group Expense Calculator Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Trip Expense Calculator
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Enter trip members and logged receipts below to see live per-person balances and minimum transfer calculations.
          </p>
        </header>

        {/* Interactive React Calculator Widget */}
        <InteractiveCalculator />

        <article className="prose prose-invert max-w-none space-y-6 text-xs sm:text-sm text-slate-300">
          <h2 className="text-xl font-bold text-white">How to Calculate Group Trip Expenses Fairly</h2>
          <p>
            When traveling with a group of friends, calculating expenses can become complex when multiple people pay for different items like Airbnb stays, grocery runs, taxi fares, and dinner bills.
          </p>

          <h3 className="text-base font-bold text-white">1. Total Spend vs Per-Person Share</h3>
          <p>
            Sum up all receipts paid across all trip members, then divide the total spend by the number of participants to find each person’s target share.
          </p>

          <h3 className="text-base font-bold text-white">2. Net Balance Calculation</h3>
          <p>
            Subtract each person’s target share from what they actually paid out of pocket. If positive, they are owed money; if negative, they owe money to the group.
          </p>

          <h3 className="text-base font-bold text-white">3. Minimum Debt Settlement Algorithm</h3>
          <p>
            Instead of everyone making 5 separate transfers to each other, TripNizer matches creditors with debtors to reduce total payments to the absolute minimum required.
          </p>
        </article>

        <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
          {user ? (
            <>
              <h2 className="text-xl font-bold text-white">Ready to Track Expenses for Your Group Trip?</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                You are logged in as <span className="font-bold text-emerald-400">{user.name}</span>. Go to your dashboard to create a trip or view active expense logs.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white">Want to Save Your Trip Expense Records?</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Create a free TripNizer account to save your trip, share a 6-character code with friends, and log expenses anytime.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
