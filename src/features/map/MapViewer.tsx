
"use client"

import React, { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_CONFIG } from './config'
import { Layers, ZoomIn, ZoomOut, Navigation, LocateFixed } from 'lucide-react'
import { useVineyardData } from '@/hooks/use-vineyard-data'
import { VineyardBlock, VineyardStat } from '@/types/vineyard'
import BlockPanel from './components/BlockPanel'

export default function MapViewer({ points }: { points?: any[] }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const { blocks, getBlockStats } = useVineyardData()
  const [selectedBlock, setSelectedBlock] = useState<{block: VineyardBlock, stats: VineyardStat[]} | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
    })

    map.current.on('load', () => {
      setIsMapReady(true)

      // Add data source
      map.current?.addSource('vineyards', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(block => ({
            type: 'Feature',
            id: block.id,
            geometry: block.geom,
            properties: {
              id: block.id,
              name: block.name,
              area: block.area_ha
            }
          }))
        },
        generateId: true
      })

      // Add fill layer
      map.current?.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyards',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.3
          ]
        }
      })

      // Add outline layer
      map.current?.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyards',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Interaction: Click
      map.current?.on('click', 'vineyard-fill', async (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0]
          const blockId = feature.properties.id
          const block = blocks.find(b => b.id === blockId)
          if (block) {
            const stats = await getBlockStats(blockId)
            setSelectedBlock({ block, stats })

            // Fly to the block
            const coordinates = (block.geom.coordinates[0] as number[][])
            const bounds = coordinates.reduce((acc, coord) => {
              return acc.extend(coord as [number, number])
            }, new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]))

            map.current?.flyTo({
              center: bounds.getCenter(),
              zoom: 15
            })
          }
        }
      })

      // Interaction: Hover
      map.current?.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId !== null) {
            map.current?.setFeatureState(
              { source: 'vineyards', id: hoveredBlockId },
              { hover: false }
            )
          }
          const id = e.features[0].id as string
          setHoveredBlockId(id)
          map.current?.setFeatureState(
            { source: 'vineyards', id },
            { hover: true }
          )
          map.current!.getCanvas().style.cursor = 'pointer'
        }
      })

      map.current?.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredBlockId !== null) {
          map.current?.setFeatureState(
            { source: 'vineyards', id: hoveredBlockId },
            { hover: false }
          )
        }
        setHoveredBlockId(null)
        map.current!.getCanvas().style.cursor = ''
      })

      // Fit bounds to show all blocks if available
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        blocks.forEach(block => {
          (block.geom.coordinates[0] as number[][]).forEach(coord => {
            bounds.extend(coord as [number, number])
          })
        })
        map.current?.fitBounds(bounds, { padding: 50 })
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [blocks])

  const handleZoomIn = () => map.current?.zoomIn()
  const handleZoomOut = () => map.current?.zoomOut()
  const handleReset = () => {
    map.current?.flyTo({
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom
    })
  }

  return (
    <div className="relative w-full h-[600px] bg-card rounded-xl overflow-hidden shadow-2xl border border-border group">
      <div
        ref={mapContainer}
        className="w-full h-full bg-[#0a0a0a]"
      />

      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Initializing geospatial layers...</span>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-6 left-6 space-y-2 z-20">
        <div className="glass-panel p-1 rounded-lg flex flex-col gap-1 bg-black/60 backdrop-blur-md border border-white/10">
          <button onClick={handleZoomIn} className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={handleZoomOut} className="p-2 hover:bg-primary/10 rounded-md transition-colors text-primary"><ZoomOut className="w-4 h-4" /></button>
        </div>
        <div className="glass-panel p-2 rounded-lg bg-black/60 backdrop-blur-md border border-white/10">
          <button onClick={handleReset} className="hover:text-primary transition-colors text-primary"><Navigation className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">Satellite Ortho</span>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20">
         <button className="glass-panel p-3 rounded-full hover:bg-primary transition-all duration-300 group-hover:scale-110 bg-black/60 backdrop-blur-md border border-white/10">
            <LocateFixed className="w-5 h-5 text-primary group-hover:text-white" />
         </button>
      </div>

      {selectedBlock && (
        <BlockPanel
          block={selectedBlock.block}
          stats={selectedBlock.stats}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {/* Map Stats Overlay */}
      <div className="absolute bottom-6 left-6 glass-panel p-4 rounded-xl hidden md:block max-w-xs animate-in slide-in-from-bottom duration-500 delay-300 bg-black/60 backdrop-blur-md border border-white/10 z-20">
        <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Live Statistics</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
            <span>Layers: {blocks.length} Blocks</span>
            <span>Source: CDSE</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3" />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground italic">
            Visualizing high-resolution multispectral imagery and indices (NDVI/NDMI).
          </p>
        </div>
      </div>
    </div>
  )
}
