import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { ExternalLink, Calendar, MapPin, Activity } from 'lucide-react'
import { getAnalyses } from '@/lib/supabase/queries'

export default async function AnalysesContent() {
  const analyses = await getAnalyses()

  return (
    <div className="container mx-auto px-4 py-24 space-y-12">
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">
          <Activity size={14} />
          Spatial Case Studies
        </div>
        <h1 className="text-4xl md:text-6xl font-headline font-bold">Geospatial Analyses Portfolio</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Deep dives into complex spatial problems. Our portfolio showcases the intersection of remote sensing, 
          automated processing pipelines, and domain-specific insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {analyses.map((analysis) => {
          // Select placeholder image based on category
          const imageId = analysis.category === 'forest' ? 'analysis-2' : 
                         analysis.category === 'urban' ? 'analysis-1' : 'analysis-3';
          const imgData = PlaceHolderImages.find(img => img.id === imageId);
          
          return (
            <Card key={analysis.id} className="group overflow-hidden bg-[#111111] border-white/[0.06] hover:border-emerald-400/50 transition-all flex flex-col">
              <div className="relative h-56 overflow-hidden">
                <Image 
                  src={imgData?.imageUrl || ""} 
                  alt={analysis.title} 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={imgData?.imageHint || "geospatial analysis"}
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/60 backdrop-blur-md text-emerald-400 border-emerald-400/20 capitalize">
                    {analysis.category}
                  </Badge>
                </div>
              </div>
              <CardHeader className="flex-grow">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(analysis.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {analysis.region}</span>
                </div>
                <CardTitle className="text-xl group-hover:text-emerald-400 transition-colors line-clamp-2">{analysis.title}</CardTitle>
                <CardDescription className="line-clamp-3 leading-relaxed text-gray-400 mt-2">
                  {analysis.summary}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0 pb-6">
                <Link href={`/analyses/${analysis.id}`} className="w-full">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-400 transition-all py-2.5 border border-emerald-400/20 rounded-lg group-hover:bg-emerald-400/10">
                    View Case Study <ExternalLink className="w-4 h-4" />
                  </div>
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
