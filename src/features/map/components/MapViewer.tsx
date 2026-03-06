
"use client"

import React, { useEffect, useRef, useState } from 'react'
import { MAP_CONFIG } from '../config'
import { Layers, ZoomIn, ZoomOut, Navigation, LocateFixed } from 'lucide-react'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  // In a real implementation with maplibre-gl installed, 
  // you would initialize the map here.
  useEffect(() => {
    // Simulating map loading
    const timer = setTimeout(() => setIsMapReady(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-[600px] bg-card rounded-xl overflow-hidden shadow-2xl border border-border group">
      {/* Mock Map Background */}
      <div 
        ref={mapContainer} 
        className="w-full h-full bg-[#0a0a0a] relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://picsum.photos/seed/map/1200/800')] bg-cover grayscale contrast-125" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        
        {/* Mock Map Grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>

        {/* Mock Data Point */}
        {!isMapReady ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Initializing geospatial layers...</span>
            </div>
          </div>
        ) : (
          <>
             {/* Center Marker */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                  <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] border-2 border-white" />
                </div>
             </div>
          </>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-6 left-6 space-y-2">
        <div className="glass-panel p-1 rounded-lg flex flex-col gap-1">
          <button className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"><ZoomIn className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"><ZoomOut className="w-4 h-4" /></button>
        </div>
        <div className="glass-panel p-2 rounded-lg">
          <button className="hover:text-primary transition-colors"><Navigation className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="absolute top-6 right-6">
        <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">Satellite Ortho</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6">
         <button className="glass-panel p-3 rounded-full hover:bg-primary transition-all duration-300 group-hover:scale-110">
            <LocateFixed className="w-5 h-5 text-primary group-hover:text-white" />
         </button>
      </div>

      {/* Map Stats Overlay */}
      <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl hidden md:block max-w-xs animate-in slide-in-from-bottom duration-500 delay-300">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Live Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
            <span>Lat: {MAP_CONFIG.center[1].toFixed(4)}</span>
            <span>Lon: {MAP_CONFIG.center[0].toFixed(4)}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3" />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground italic">
            Visualizing high-resolution multispectral imagery from Sentinel-2.
          </p>
        </div>
      </div>
    </div>
  )
}