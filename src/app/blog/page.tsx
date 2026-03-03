import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | GeoWorldLook',
  description: 'Technical articles on remote sensing, satellite data pipelines, and high-performance spatial database optimization.'
};

const blogPosts = [
  {
    slug: 'cloud-native-raster-tiling',
    title: 'Cloud-Native Raster Tiling: From GeoTIFF to COG',
    excerpt: 'Explore the performance benefits of Cloud Optimized GeoTIFFs (COGs) and how they revolutionize distributed geospatial workflows for large-scale satellite processing.',
    date: 'February 24, 2024',
    readTime: '8 min read',
    tags: ['Architecture', 'Raster', 'Sentinel'],
    image: 'blog-1'
  },
  {
    slug: 'postgis-spatial-indexing-strategies',
    title: 'Advanced Spatial Indexing in PostGIS',
    excerpt: 'A deep dive into GIST vs. BRIN indexes for massive spatial datasets and how to optimize your query performance for real-time applications.',
    date: 'February 12, 2024',
    readTime: '12 min read',
    tags: ['Database', 'PostgreSQL', 'PostGIS'],
    image: 'blog-1'
  }
];

export default function BlogPage() {
  const blogPlaceholder = PlaceHolderImages.find(img => img.id === 'blog-1');

  return (
    <div className="max-w-6xl mx-auto px-4 py-24 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <BookOpen size={14} />
          Technical Insights
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white">Geospatial Engineering Blog</h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          Technical articles on remote sensing, satellite data pipelines, and high-performance spatial database optimization.
        </p>
      </div>

      <div className="space-y-8 max-w-5xl mx-auto">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <Card className="group border-white/[0.06] bg-[#111]/50 hover:bg-[#111] hover:border-emerald-400/30 transition-all overflow-hidden p-0">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                  <Image 
                    src={blogPlaceholder?.imageUrl || ""} 
                    alt={post.title} 
                    fill
                    className="object-cover"
                    data-ai-hint="digital globe analysis"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="md:w-2/3 p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap gap-4 items-center text-xs text-gray-500">
                    <span className="bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-mono tracking-widest">{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                  </div>
                  <CardTitle className="text-2xl text-white group-hover:text-emerald-400 transition-colors">{post.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-gray-400 line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-emerald-400 font-bold group-hover:gap-4 transition-all">
                      Read Technical Article <ArrowRight className="w-4 h-4" />
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
