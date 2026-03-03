
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { ArrowRight, Clock, Tag } from 'lucide-react'

const blogPosts = [
  {
    slug: 'optimizing-raster-tiling',
    title: 'Cloud-Native Raster Tiling: From GeoTIFF to COG',
    excerpt: 'Explore the performance benefits of Cloud Optimized GeoTIFFs (COGs) and how they revolutionize distributed geospatial workflows.',
    date: 'February 24, 2024',
    readTime: '8 min read',
    tags: ['Architecture', 'Raster', 'Performance'],
    image: 'blog-1'
  },
  {
    slug: 'postgis-spatial-indexing',
    title: 'Mastering Spatial Indexing in PostGIS',
    excerpt: 'A deep dive into GIST vs. BRIN indexes for massive spatial datasets and how to optimize your query performance.',
    date: 'February 12, 2024',
    readTime: '12 min read',
    tags: ['Database', 'SQL', 'Optimization'],
    image: 'blog-1'
  },
  {
    slug: 'vector-tile-styling-maplibre',
    title: 'Modern Map Styling with MapLibre GL JS',
    excerpt: 'Learn how to create dynamic, data-driven visualizations using expressions and vector tile properties in the browser.',
    date: 'January 28, 2024',
    readTime: '6 min read',
    tags: ['Frontend', 'UI/UX', 'MapLibre'],
    image: 'blog-1'
  }
]

export default function BlogContent() {
  const blogPlaceholder = PlaceHolderImages.find(img => img.id === 'blog-1');

  return (
    <div className="container mx-auto px-4 py-24 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-headline font-bold">Technical Blog</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Sharing knowledge on geospatial engineering, satellite data processing, and high-performance spatial databases.
        </p>
      </div>

      <div className="space-y-8">
        {blogPosts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <Card className="group border-white/[0.06] bg-[#111111]/50 hover:bg-[#111111] hover:border-emerald-400/30 transition-all p-4 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                <div className="lg:col-span-1 relative h-48 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                  <Image 
                    src={blogPlaceholder?.imageUrl || ""} 
                    alt={post.title} 
                    fill
                    className="object-cover"
                    data-ai-hint="digital networking globe"
                  />
                </div>
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex flex-wrap gap-4 items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono uppercase tracking-widest bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded">{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
                    <div className="flex gap-2">
                      {post.tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-emerald-400/80"><Tag className="w-3 h-3" /> {tag}</span>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-headline group-hover:text-emerald-400 transition-colors">{post.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-gray-400 md:line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-emerald-400 font-bold group-hover:gap-4 transition-all">
                      Read Full Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      <div className="flex justify-center pt-12">
        <Button variant="outline" className="px-12 py-6 rounded-full text-lg border-emerald-400/20 hover:border-emerald-400/50 hover:bg-emerald-400/5 text-emerald-400">Load More Articles</Button>
      </div>
    </div>
  )
}
