import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, ArrowRight, Sparkles, Users } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Group Trip Planner - AI Itinerary & Group Vacation Planning',
  description: 'Plan group trips effortlessly with AI itinerary recommendations, shared trip codes, group chat, and collaborative checklists.',
  alternates: {
    canonical: `${baseUrl}/group-trip-planner`,
  },
  openGraph: {
    title: 'Group Trip Planner - AI Itinerary & Group Vacation Planning',
    description: 'Plan group trips effortlessly with AI itinerary recommendations and shared trip codes.',
    url: `${baseUrl}/group-trip-planner`,
    type: 'website',
  },
};

export default function GroupTripPlannerPage() {
  return (
    <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Compass className="w-4 h-4" /> Group Trip Planner Feature
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
          Group Trip Planner App
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          From AI itinerary suggestions to live group chat and packing checklists, plan every detail of your vacation together.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl w-fit">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">AI-Powered Itinerary Ideas</h3>
          <p className="text-xs text-slate-300">
            Get personalized activity and place recommendations tailored to your destination and group preferences.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Unjoined Member Management</h3>
          <p className="text-xs text-slate-300">
            Host can include friends who haven’t downloaded the app yet so group expenses stay 100% accurate.
          </p>
        </div>
      </section>

      <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Start Planning Your Group Trip</h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          Create a trip in seconds and share your 6-character trip code with friends.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
        >
          Plan A Trip Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
