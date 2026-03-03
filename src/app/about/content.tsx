
import React from 'react'
import Image from 'next/image'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { Map, Code, Database, Satellite } from 'lucide-react'

export default function AboutContent() {
  const profileImg = PlaceHolderImages.find(img => img.id === 'author-profile');

  return (
    <div className="container mx-auto px-4 py-24 space-y-24">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h1 className="text-4xl md:text-6xl font-headline font-bold">Unlocking the Power of <span className="text-emerald-400">Spatial Intelligence</span></h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Founded on the principle that location is the most important context for all human activities, GeoWorldLook specializes in building the tools and analyses that help us understand our rapidly changing world.
          </p>
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-l-4 border-emerald-400 pl-4">Our Mission</h3>
            <p className="text-muted-foreground">To democratize access to high-fidelity geospatial intelligence through innovative engineering and intuitive design.</p>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-400/20 rounded-3xl rotate-3" />
          <div className="relative rounded-3xl overflow-hidden aspect-video border border-white/10 shadow-2xl">
             <Image 
              src="https://picsum.photos/seed/office/800/600" 
              alt="Geospatial Hub" 
              width={800}
              height={600}
              className="object-cover"
              data-ai-hint="modern spatial analysis hub"
            />
          </div>
        </div>
      </section>

      <section className="bg-card/50 backdrop-blur-sm p-12 rounded-3xl border border-white/[0.06]">
        <h2 className="text-3xl font-bold mb-12 text-center">Core Competencies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { icon: Satellite, title: "Remote Sensing", desc: "Expertise in SAR, Multispectral, and LiDAR data fusion." },
            { icon: Database, title: "Spatial RDBMS", desc: "Optimizing petabyte-scale spatial databases for low-latency queries." },
            { icon: Code, title: "Geospatial Dev", desc: "Building custom GIS web and mobile applications from the ground up." },
            { icon: Map, title: "Cartography", desc: "Creating beautiful, data-driven maps that tell a compelling story." }
          ].map((item, idx) => (
            <div key={idx} className="space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold">{item.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="shrink-0">
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-400">
               <Image 
                src={profileImg?.imageUrl || ""} 
                alt="Principal" 
                fill
                className="object-cover"
                data-ai-hint="professional headshot"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Meet the Founder</h2>
            <p className="text-muted-foreground leading-relaxed">
              With over a decade of experience in federal geospatial programs and international humanitarian mapping, our principal lead brings a wealth of hands-on knowledge in turning pixels into actionable insights.
            </p>
            <div className="flex gap-4">
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">GISP Certified</span>
              <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">PhD Geo Informatics</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
