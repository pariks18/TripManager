import type { Metadata } from 'next';
import { InteractiveChecklist } from '@/components/seo/InteractiveChecklist';
import Link from 'next/link';
import { CheckSquare, ArrowRight } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Group Trip Checklist Tool - Shared Packing & Prep Lists',
  description: 'Free group trip checklist and packing list template. Organize shared items, assign host permissions, and manage personal items effortlessly.',
  alternates: {
    canonical: `${baseUrl}/group-trip-checklist`,
  },
  openGraph: {
    title: 'Group Trip Checklist Tool - Shared Packing & Prep Lists',
    description: 'Organize shared group items and personal packing lists for your next group vacation.',
    url: `${baseUrl}/group-trip-checklist`,
    type: 'website',
  },
};

export default function GroupTripChecklistPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Group Trip Checklist Tool',
    operatingSystem: 'All browsers',
    applicationCategory: 'TravelApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'Shared group trip packing list and item checklist generator.',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
            <CheckSquare className="w-4 h-4" /> Free Group Checklist Tool
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Group Trip Packing Checklist
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Avoid duplicate items and missing essentials. Separate shared group items from personal packing lists.
          </p>
        </header>

        {/* Interactive Checklist Preview */}
        <InteractiveChecklist />

        <article className="prose prose-invert max-w-none space-y-6 text-xs sm:text-sm text-slate-300">
          <h2 className="text-xl font-bold text-white">Why Separate Group Items from Personal Items?</h2>
          <p>
            On a group vacation, items like first-aid kits, bluetooth speakers, and game boards only need to be brought by one person. TripNizer allows the Trip Host to assign shared group items to specific members so everyone knows their responsibility.
          </p>

          <h3 className="text-base font-bold text-white">Host-Only Assignment Permissions</h3>
          <p>
            To prevent chaotic reassignments, only the Trip Host has permission to assign or reassign group checklist items to other members. Regular members can view their assignments and mark items complete.
          </p>

          <h3 className="text-base font-bold text-white">Per-User Completion Tracking</h3>
          <p>
            When multiple members complete a group item (like buying snacks), completion is tracked per user so every contributor receives credit without overwriting previous checkmarks.
          </p>
        </article>

        <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Create a Custom Checklist for Your Trip</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Create a trip, customize pre-seeded categories, and share with your group in seconds.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
