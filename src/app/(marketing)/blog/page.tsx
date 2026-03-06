
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Clock, BookOpen, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | GeoWorldLook',
  description: 'Technical articles on remote sensing, satellite data pipelines, and high-performance spatial database optimization.'
};

const blogPosts = [
  {
    slug: 'sentinel-2-forest-monitoring',
    title: 'Automating Forest Health Monitoring with Sentinel-2',
    summary: 'How we build daily processing pipelines to detect bark beetle infestation using multi-spectral satellite imagery.',
    date: '2026-02-15',
    readTime: '8 min read',
    tags: ['Sentinel-2', 'Python', 'Remote Sensing']
  },
  {
    slug: 'postgis-optimization-large-datasets',
    title: 'Optimizing PostGIS for High-Performance Geospatial Queries',
    summary: 'Advanced indexing strategies and query optimization techniques for handling millions of spatial records in real-time.',
    date: '2026-01-28',
    readTime: '12 min read',
    tags: ['PostGIS', 'SQL', 'Database']
  },
  {
    slug: 'urban-heat-island-landsat-8',
    title: 'Mapping Urban Heat Islands using Landsat-8 Thermal Bands',
    summary: 'A step-by-step guide to calculating Land Surface Temperature (LST) and analyzing urban thermal dynamics.',
    date: '2026-01-10',
    readTime: '10 min read',
    tags: ['Landsat-8', 'Urban Planning', 'Thermal']
  }
];

export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-24 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <BookOpen size={14} />
          Technical Insights
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Geospatial Engineering Blog</h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Technical articles and insights on remote sensing, satellite data pipelines, and spatial analysis.
        </p>
      </div>

      <div className="space-y-8 max-w-5xl mx-auto">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <Card className="group border-white/[0.06] bg-[#111]/50 hover:bg-[#111] hover:border-emerald-400/30 transition-all overflow-hidden p-0">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden bg-[#0d0d0d] flex items-center justify-center shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                    <span className="text-emerald-400 text-xl font-mono">◈</span>
                  </div>
                </div>

                <div className="md:w-2/3 p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap gap-4 items-center text-xs text-gray-500">
                    <span className="bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded-md uppercase font-mono tracking-widest">
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                  </div>
                  
                  <CardTitle className="text-2xl text-white group-hover:text-emerald-400 transition-colors">
                    {post.title}
                  </CardTitle>
                  
                  <CardDescription className="text-base leading-relaxed text-gray-400 line-clamp-2">
                    {post.summary}
                  </CardDescription>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {post.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        <Tag size={10} className="text-emerald-400/50" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4">
                    <span className="inline-flex items-center gap-2 text-emerald-400 font-bold group-hover:gap-4 transition-all text-sm">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
