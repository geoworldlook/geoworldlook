import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: `${params.slug.replace(/-/g, ' ')} | GeoWorldLook Blog`,
    description: 'Geospatial engineering insights and technical deep dives.'
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;

  return (
    <article className="max-w-4xl mx-auto px-4 py-24">
      <Link href="/blog" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-12 hover:gap-3 transition-all">
        <ArrowLeft size={16} />
        Back to Blog
      </Link>

      <header className="mb-12">
        <div className="flex flex-wrap gap-6 items-center text-xs text-gray-500 mb-6 font-mono uppercase tracking-widest">
          <span className="flex items-center gap-2"><Calendar size={14} className="text-emerald-400" /> February 24, 2024</span>
          <span className="flex items-center gap-2"><Clock size={14} className="text-emerald-400" /> 8 min read</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed italic">
          Technical deep dive into geospatial data engineering and satellite processing workflows.
        </p>
      </header>

      <div className="prose prose-invert prose-emerald max-w-none">
        <p>
          In modern geospatial engineering, the transition from traditional tiled raster formats to cloud-native solutions has significantly reduced the latency of large-scale analysis. This article explores how we leverage specific data formats to optimize orbital data ingestion.
        </p>
        <h2>The Architecture</h2>
        <p>
          Our automated Python pipelines process Sentinel-1 and Sentinel-2 imagery, extracting spectral indices like NDVI and NDWI before storing the derived metrics in a spatial PostGIS database.
        </p>
        <blockquote>
          "By adopting cloud-optimized geospatial formats, we reduce the computational overhead of multi-temporal analysis by over 40%."
        </blockquote>
        <p>
          Stay tuned for the full technical walkthrough of our automated ingestion engine.
        </p>
      </div>
    </article>
  );
}
