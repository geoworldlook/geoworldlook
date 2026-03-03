
import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { ExternalLink, Calendar, MapPin } from 'lucide-react'

const analyses = [
  {
    id: 'urban-growth-2024',
    title: 'Post-Pandemic Urban Shift',
    description: 'Analyzing the geospatial migration patterns of workforce in major US tech hubs using cellular geolocation metadata.',
    image: 'analysis-1',
    category: 'Urban Planning',
    date: 'March 2024',
    location: 'United States'
  },
  {
    id: 'amazon-deforestation',
    title: 'Real-time Deforestation Alerting',
    description: 'Implementation of a localized change-detection algorithm using Sentinel-1 Radar data to bypass cloud cover in the tropics.',
    image: 'analysis-2',
    category: 'Environment',
    date: 'January 2024',
    location: 'Amazon Basin'
  },
  {
    id: 'coastal-erosion-risk',
    title: 'Sea Level Rise Risk Assessment',
    description: 'Bathy-LiDAR integrated modeling of coastal resilience along the Florida coastline for regional insurance risk profiling.',
    image: 'analysis-3',
    category: 'Climate Risk',
    date: 'November 2023',
    location: 'Florida, USA'
  }
]

export default function AnalysesPage() {
  return (
    <div className="container mx-auto px-4 py-24 space-y-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-headline font-bold">Geospatial Analyses Portfolio</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Deep dives into complex spatial problems. Our case studies showcase the intersection of remote sensing, data science, and domain expertise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {analyses.map((analysis) => {
          const imgData = PlaceHolderImages.find(img => img.id === analysis.image);
          return (
            <Card key={analysis.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
              <div className="relative h-64 overflow-hidden">
                <Image 
                  src={imgData?.imageUrl || ""} 
                  alt={analysis.title} 
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint={imgData?.imageHint || "analysis"}
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-background/80 backdrop-blur-md text-primary hover:bg-background border-primary/20">
                    {analysis.category}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {analysis.date}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {analysis.location}</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{analysis.title}</CardTitle>
                <CardDescription className="line-clamp-3 leading-relaxed">
                  {analysis.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Link href={`/analyses/${analysis.id}`} className="w-full">
                  <div className="flex items-center justify-center gap-2 text-sm font-bold text-primary group-hover:gap-4 transition-all py-2 border border-primary/20 rounded-lg group-hover:bg-primary/5">
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
