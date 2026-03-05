import React from 'react'
import Link from 'next/link'
import { ArrowRight, Trees, Thermometer, Layers } from 'lucide-react'
import { getSpatialData, getVineyardBlocks } from '@/lib/supabase/queries'
import MapViewerWrapper from '@/features/map/MapViewerWrapper'

export default async function LandingPage() {
  const [spatialData, vineyardBlocks] = await Promise.all([
    getSpatialData(),
    getVineyardBlocks()
  ])

  return (
    <div className="flex flex-col w-full">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen flex items-center bg-[#0a0a0a] overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        {/* Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-medium tracking-widest uppercase border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live Satellite Data
            </span>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Satellite Intelligence<br />
              <span className="text-emerald-400">for Real Decisions</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mt-6 max-w-xl">
              Geospatial analytics powered by Sentinel-1/2 satellite data, 
              automated ML pipelines and daily-updated spatial databases.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-8">
              <Link href="/analyses" 
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
                Explore Analyses
                <ArrowRight size={16} />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white px-6 py-3 rounded-lg transition-colors duration-200">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS BAR */}
      <section className="border-y border-white/[0.06] bg-[#0d0d0d] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">Sentinel-2</p>
              <p className="text-gray-500 text-sm">10m Resolution</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">24h</p>
              <p className="text-gray-500 text-sm">Data Update Cycle</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">PostGIS</p>
              <p className="text-gray-500 text-sm">Spatial Database</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — MAP PREVIEW */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <p className="text-emerald-400 text-xs uppercase tracking-widest mb-2">
              Live Coverage
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Real-Time Spatial Data
            </h2>
            <p className="text-gray-400 max-w-xl">
              Daily ingested geospatial data from automated satellite 
              processing pipelines, visualized on interactive maps.
            </p>
          </div>
          
          <div className="w-full h-[500px] rounded-xl border border-white/[0.06] overflow-hidden">
            <MapViewerWrapper points={spatialData} vineyardBlocks={vineyardBlocks} />
          </div>
          
          <p className="text-gray-600 text-xs mt-3 text-center italic">
            Data updated daily · Powered by Sentinel-1/2 satellites
          </p>
        </div>
      </section>

      {/* SECTION 4 — SERVICES */}
      <section className="py-20 bg-[#0a0a0a] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6 hover:border-emerald-400/20 transition-colors duration-300 group">
              <Trees className="text-emerald-400 mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Forest Health Monitoring</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Bark beetle detection and forest dieback mapping using NDVI time-series analysis on Sentinel-2 data.
              </p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold group-hover:underline">
                View analyses →
              </Link>
            </div>

            <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6 hover:border-emerald-400/20 transition-colors duration-300 group">
              <Thermometer className="text-emerald-400 mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Urban Thermal Analysis</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Land Surface Temperature mapping and heat island detection for urban planning and adaptation.
              </p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold group-hover:underline">
                View analyses →
              </Link>
            </div>

            <div className="bg-[#111] border border-white/[0.06] rounded-xl p-6 hover:border-emerald-400/20 transition-colors duration-300 group">
              <Layers className="text-emerald-400 mb-4" size={32} />
              <h3 className="text-xl font-bold text-white mb-2">Change Detection</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Multi-temporal SAR and optical data fusion for land cover change detection and monitoring.
              </p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold group-hover:underline">
                View analyses →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — CTA BANNER */}
      <section className="py-20 px-4 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto text-center bg-[#111] border border-emerald-400/10 rounded-2xl p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need Custom Geospatial Analysis?
          </h2>
          <p className="text-gray-400 mb-8">
            Satellite data processed, analyzed and delivered 
            for your specific region and use case.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-lg transition-colors">
            Start a Project
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
