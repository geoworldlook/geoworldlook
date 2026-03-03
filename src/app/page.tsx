
import MapViewer from '@/features/map/components/MapViewer';
import { Button } from '@/components/ui/button';
import { ArrowRight, Satellite, Database, BarChart3, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-map');

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-32 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <Satellite className="w-4 h-4" /> Next-Gen Geospatial Insights
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
              Visualize the <span className="text-primary italic">Earth</span> in Real-Time
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Explore complex geospatial data with our advanced interactive mapping engine. We transform satellite imagery and spatial statistics into actionable intelligence.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                Launch Explorer <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-muted hover:bg-muted transition-colors">
                View Portfolio
              </Button>
            </div>
          </div>
          
          <div className="relative animate-in fade-in slide-in-from-right duration-1000 delay-200">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image 
                src={heroImage?.imageUrl || ""} 
                alt={heroImage?.description || "Hero"} 
                width={1200}
                height={600}
                className="object-cover hover:scale-105 transition-transform duration-700"
                data-ai-hint="satellite earth view"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="bg-card/30 py-24 border-y border-border">
        <div className="container mx-auto px-4 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">Interactive Spatial Viewer</h2>
            <p className="text-muted-foreground">
              Dynamic layers, real-time filtering, and sub-meter precision. Our viewer allows you to peel back the layers of the planet.
            </p>
          </div>
          <MapViewer />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: Database, 
              title: "Proprietary Data Ingest", 
              desc: "Seamlessly processing multi-terabyte spatial datasets from global providers." 
            },
            { 
              icon: BarChart3, 
              title: "Advanced Analytics", 
              desc: "Leveraging ML to identify land-use changes, vegetation health, and urban growth." 
            },
            { 
              icon: ShieldCheck, 
              title: "Enterprise Reliability", 
              desc: "Built on high-availability infrastructure for 99.9% uptime for critical missions." 
            }
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <feature.icon className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 mb-12">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-primary px-8 py-16 md:p-16 text-center text-primary-foreground space-y-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            
            <h2 className="text-4xl md:text-5xl font-headline font-bold">Ready to see the world differently?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Join hundreds of organizations using GeoWorldLook for precision planning and environmental monitoring.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" variant="secondary" className="font-bold">Get Started Now</Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
