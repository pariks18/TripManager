import type { Metadata } from 'next';
import Link from 'next/link';
import { CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Group Travel Expense Tracker - Log & Split Vacation Spending',
  description: 'Effortlessly track group vacation spending, record shared receipts, and auto-calculate debt transfers with our free travel expense tracker.',
  alternates: {
    canonical: `${baseUrl}/travel-expense-tracker`,
  },
  openGraph: {
    title: 'Group Travel Expense Tracker - Log & Split Vacation Spending',
    description: 'Effortlessly track group vacation spending and calculate minimum balance transfers with TripNizer.',
    url: `${baseUrl}/travel-expense-tracker`,
    type: 'website',
  },
};

export default function TravelExpenseTrackerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TripNizer Travel Expense Tracker',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web, Mobile',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Track group trip costs, log receipts, and minimize balance transfers.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <CreditCard className="w-4 h-4" /> Travel Expense Tracker Feature
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Group Travel Expense Tracker
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Never lose track of who paid for dinner, gas, or tickets. Log expenses instantly on mobile and let TripNizer calculate the rest.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant Receipt Logging</h3>
            <p className="text-xs text-slate-300">
              Add costs on the go. Attach categories like Food & Drinks, Stay, Transport, and Activities.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Debt Minimization Algorithm</h3>
            <p className="text-xs text-slate-300">
              Instead of dozens of crisscross transfers, TripNizer simplifies group balances into the absolute minimum payments.
            </p>
          </div>
        </section>

        <section className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Start Tracking Group Expenses Today</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Free forever for unlimited trips and members. Create a trip code and invite your friends in seconds.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
