import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/lib/blogData';
import { Compass, ArrowRight, Clock } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export const metadata: Metadata = {
  title: 'Group Travel & Expense Splitting Blog - TripNizer',
  description: 'Expert guides and actionable tips on splitting trip expenses, travel budgeting, group vacation planning, and packing checklists.',
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
  openGraph: {
    title: 'Group Travel & Expense Splitting Blog - TripNizer',
    description: 'Expert guides on splitting trip expenses, travel budgeting, and group vacation planning.',
    url: `${baseUrl}/blog`,
    type: 'website',
  },
};

export default function BlogIndexPage() {
  return (
    <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-5xl mx-auto space-y-12">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold">
          <Compass className="w-4 h-4" /> Travel & Expense Blog
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
          Group Travel Guides & Budgeting Tips
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Discover practical advice for splitting vacation costs, planning group trips, and managing shared expenses.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {blogPosts.map((post) => (
          <article key={post.slug} className="bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 space-y-4 flex flex-col justify-between transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                  {post.cluster}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {post.readTime}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {post.description}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href={`/blog/${post.slug}`}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
              >
                Read article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
