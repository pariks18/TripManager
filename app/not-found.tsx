import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl mb-4">
        <Compass className="w-12 h-12 text-emerald-400 animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The page or trip resource you are looking for doesn’t exist or has moved.
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-2xl transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go to Homepage
        </Link>
        <Link
          href="/trip-expense-calculator"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl border border-white/10 transition-all"
        >
          Trip Expense Calculator
        </Link>
      </div>
    </div>
  );
}
