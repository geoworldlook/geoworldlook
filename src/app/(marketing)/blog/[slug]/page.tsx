
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, ChevronRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [
    { slug: 'sentinel-2-forest-monitoring' },
    { slug: 'postgis-optimization-large-datasets' },
    { slug: 'urban-heat-island-landsat-8' }
  ];
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  
  // Simple check for valid slugs (replaces complex notebook logic)
  const validSlugs = ['sentinel-2-forest-monitoring', 'postgis-optimization-large-datasets', 'urban-heat-island-landsat-8'];
  if (!validSlugs.includes(slug)) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-24">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-12">
        <Link href="/blog" className="text-emerald-400 hover:underline transition-all">Blog</Link>
        <ChevronRight size={14} />
        <span className="truncate">Article Details</span>
      </div>

      <Link href="/blog" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-8 hover:gap-3 transition-all">
        <ArrowLeft size={16} />
        Back to Blog
      </Link>

      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight capitalize">
          {slug.replace(/-/g, ' ')}
        </h1>
        <div className="flex items-center gap-6 text-xs text-gray-500 font-mono uppercase tracking-widest">
          <span className="flex items-center gap-2"><Calendar size={14} className="text-emerald-400" /> Feb 20, 2026</span>
          <span className="flex items-center gap-2"><Clock size={14} className="text-emerald-400" /> 10 min read</span>
        </div>
      </header>

      <div className="prose prose-invert prose-emerald max-w-none">
        <p>This is a placeholder for the article content. In this stable version, we have reverted the dynamic notebook rendering to ensure core stability.</p>
        <h2>Overview</h2>
        <p>Detailed technical content will be restored as static or CMS-driven content in future updates.</p>
      </div>
    </article>
  );
}
