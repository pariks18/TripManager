import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts } from '@/lib/blogData';
import { ArrowLeft, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tripnizer.com';

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | TripNizer Blog`,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TripNizer',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };

  const faqLd = post.content.faq
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.content.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <div className="py-12 sm:py-20 px-6 sm:px-12 max-w-3xl mx-auto space-y-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to all articles
        </Link>

        <header className="space-y-4 border-b border-white/10 pb-8">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
              {post.cluster}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> {post.readTime}
            </span>
            <span>• Published {post.publishedAt}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
            {post.title}
          </h1>

          <p className="text-sm text-slate-300 italic leading-relaxed">
            {post.description}
          </p>
        </header>

        <article className="space-y-8 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p className="text-sm font-medium text-slate-200">{post.content.intro}</p>

          {post.content.sections.map((section, idx) => (
            <section key={idx} className="space-y-2">
              <h2 className="text-lg font-bold text-white mt-6">{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}

          {post.content.faq && post.content.faq.length > 0 && (
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 mt-8">
              <h3 className="text-base font-bold text-white">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {post.content.faq.map((f, i) => (
                  <div key={i} className="space-y-1">
                    <strong className="text-xs sm:text-sm font-bold text-emerald-400 block">{f.question}</strong>
                    <p className="text-xs text-slate-300">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Product Feature CTA */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-8 rounded-3xl text-center space-y-4 mt-12">
          <h3 className="text-lg font-bold text-white">Simplify Your Next Group Vacation</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Use TripNizer to track expenses, calculate minimum settlements, and organize checklists effortlessly.
          </p>
          <Link
            href={post.content.ctaLink}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
          >
            {post.content.ctaText} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
