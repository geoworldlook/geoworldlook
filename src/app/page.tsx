
import React from 'react'
import Link from 'next/link'
import { ArrowRight, Trees, Thermometer, Layers } from 'lucide-react'
import { getSpatialData } from '@/lib/supabase/queries'
import MapViewerWrapper from '@/features/map/MapViewerWrapper'

export default async function LandingPage() {
  const spatialData = await getSpatialData()

  return (
    <div className="flex flex-col w-full">
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[90vh] flex items-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 w-full py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-medium tracking-widest uppercase border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live Satellite Intelligence
            </span>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight mb-6">
              Geospatial Data<br />
              <span className="text-emerald-400">for Real Decisions</span>
            </h1>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              High-fidelity analytics powered by Sentinel-1/2 satellite data, automated ML pipelines, and production-grade spatial databases.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/analyses" 
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-4 rounded-lg transition-all duration-200">
                Explore Analyses
                <ArrowRight size={18} />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-8 py-4 rounded-lg transition-all duration-200">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — STATS */}
      <section className="border-y border-white/[0.06] bg-[#0d0d0d] py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <p className="text-2xl font-bold text-white">Sentinel-2</p>
              <p className="text-gray-500 text-sm uppercase tracking-wider">10m Ground Resolution</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">24h Cycle</p>
              <p className="text-gray-500 text-sm uppercase tracking-wider">Data Update Frequency</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">PostGIS</p>
              <p className="text-gray-500 text-sm uppercase tracking-wider">Advanced Spatial Engine</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — MAP PREVIEW */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Geospatial Coverage</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Real-Time Activity Layers</h2>
            <p className="text-gray-400 max-w-2xl text-lg">
              Interact with daily ingested spatial data from our automated satellite processing pipelines.
            </p>
          </div>
          
          <div className="w-full h-[600px] rounded-2xl border border-white/[0.06] overflow-hidden relative">
            <MapViewerWrapper points={spatialData} />
          </div>
        </div>
      </section>

      {/* SECTION 4 — SERVICES */}
      <section className="py-24 bg-[#0d0d0d] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 hover:border-emerald-400/20 transition-all group">
              <Trees className="text-emerald-400 w-8 h-8 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Forest Monitoring</h3>
              <p className="text-gray-400 leading-relaxed mb-6">Advanced dieback mapping and health assessment using NDVI time-series analysis.</p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold flex items-center gap-2">View Case Studies <ArrowRight size={14} /></Link>
            </div>
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 hover:border-emerald-400/20 transition-all group">
              <Thermometer className="text-emerald-400 w-8 h-8 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Urban Heat Analysis</h3>
              <p className="text-gray-400 leading-relaxed mb-6">Micro-climate mapping and Land Surface Temperature detection for urban planning.</p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold flex items-center gap-2">Explore Analytics <ArrowRight size={14} /></Link>
            </div>
            <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-8 hover:border-emerald-400/20 transition-all group">
              <Layers className="text-emerald-400 w-8 h-8 mb-6" />
              <h3 className="text-xl font-bold text-white mb-4">Change Detection</h3>
              <p className="text-gray-400 leading-relaxed mb-6">Multi-temporal SAR and optical data fusion for large-scale land cover alerts.</p>
              <Link href="/analyses" className="text-emerald-400 text-sm font-bold flex items-center gap-2">See Detection Log <ArrowRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
