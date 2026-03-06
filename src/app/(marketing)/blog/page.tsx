import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Clock, BookOpen, Tag } from 'lucide-react';
import { getAllNotebooks } from '@/lib/notebooks';

export const metadata: Metadata = {
  title: 'Blog | GeoWorldLook',
  description: 'Technical articles on remote sensing, satellite data pipelines, and high-performance spatial database optimization.'
};

export default function BlogPage() {
  const notebooks = getAllNotebooks();

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <BookOpen size={14} />
          Technical Insights
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Geospatial Engineering Blog</h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Technical articles and Jupyter Notebook walkthroughs on remote sensing, satellite data pipelines, and spatial analysis.
        </p>
      </div>

      <div className="space-y-8 max-w-5xl mx-auto">
        {notebooks.length === 0 ? (
          <div className="text-center py-20 border border-white/[0.06] rounded-2xl bg-[#111]/30">
            <p className="text-gray-500">No technical articles found. Check back soon for new notebook exports.</p>
          </div>
        ) : (
          notebooks.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
              <Card className="group border-white/[0.06] bg-[#111]/50 hover:bg-[#111] hover:border-emerald-400/30 transition-all overflow-hidden p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Decorative Side Panel */}
                  <div className="md:w-1/3 relative h-48 md:h-auto overflow-hidden bg-[#0d0d0d] flex items-center justify-center shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-400/5 flex items-center justify-center border border-emerald-400/10">
                      <span className="text-emerald-400 text-2xl font-mono">ipynb</span>
                    </div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
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
                        View Notebook Analysis <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
