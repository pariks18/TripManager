import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Users, CreditCard, CheckSquare, Calculator, Compass } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'TripNizer - Free Group Travel Expense Splitter & Planner',
  description: 'Effortlessly split trip expenses with friends, track vacation budgets, calculate minimum transfers, and organize group checklists without manual math.',
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: 'TripNizer - Free Group Travel Expense Splitter & Planner',
    description: 'Effortlessly split trip expenses with friends, track vacation budgets, calculate minimum transfers, and organize group checklists.',
    url: baseUrl,
    siteName: 'TripNizer',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TripNizer - Free Group Travel Expense Splitter & Planner',
    description: 'Effortlessly split trip expenses with friends without manual math.',
  },
};

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TripNizer',
    operatingSystem: 'Web, iOS, Android',
    applicationCategory: 'TravelApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Group travel expense tracker and planner app for splitting trip costs with friends.',
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does TripNizer split group trip expenses?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TripNizer allows trip members to log expenses, automatically calculates equal or custom shares, and computes debt minimization transfers so everyone makes the fewest payments possible.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do my friends need to download an app to join a trip?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No, friends can join instantly via web link or a 6-character trip code from any browser on phone or desktop.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-5xl mx-auto space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
            <Sparkles className="w-4 h-4" /> Mobile-First Group Expense Splitter
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white">
            Split Trip Expenses <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">Without Confusion</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            One person creates a trip. Everyone joins with a 6-character code. Expenses split automatically. Zero math required.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition-all inline-flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/trip-expense-calculator"
              className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/10 transition-all inline-flex items-center justify-center gap-2"
            >
              Try Calculator Tool <Calculator className="w-4 h-4 text-emerald-400" />
            </Link>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Everything You Need for Group Travel</h2>
            <p className="text-xs sm:text-sm text-slate-400">Streamline expenses, planning, and group prep in one app</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Split Travel Expenses</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Log shared hotel costs, meals, and gas. Automatically calculate individual balances and simplify debts.
              </p>
              <Link href="/split-travel-expenses" className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1">
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl w-fit">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Group Trip Checklist</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Manage shared items and personal packing lists. Only trip hosts assign items to prevent clutter.
              </p>
              <Link href="/group-trip-checklist" className="text-xs font-bold text-blue-400 hover:underline inline-flex items-center gap-1">
                Explore checklist <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md space-y-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Group Trip Planner</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                AI itinerary suggestions, group chat, and unjoined member support for friends without accounts.
              </p>
              <Link href="/group-trip-planner" className="text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1">
                Plan your trip <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* SEO Article & Guide Highlights */}
        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Popular Group Travel Guides</h2>
              <p className="text-xs text-slate-400 mt-1">Read expert advice on managing money and planning trips with friends</p>
            </div>
            <Link href="/blog" className="text-xs font-bold text-emerald-400 hover:underline">
              View all blog articles →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/how-to-split-group-trip-expenses" className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 rounded-2xl transition-all">
              <h3 className="text-sm font-bold text-white">How to Split Group Trip Expenses Fairly</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Learn proven strategies to manage group travel finances and eliminate awkward debt conversations.</p>
            </Link>
            <Link href="/blog/how-to-split-hotel-costs-with-friends" className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/40 rounded-2xl transition-all">
              <h3 className="text-sm font-bold text-white">How to Split Hotel Costs with Friends</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">Fairly divide Airbnb rentals, hotel room nights, and luxury suites across group members.</p>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
