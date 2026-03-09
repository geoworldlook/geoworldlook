
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockWithStats | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || blocksLoading) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    })

    mapInstance.current = map
    map.addControl(new maplibregl.NavigationControl(), 'bottom-left')

    map.on('load', () => {
      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        }
      })

      // Polygons layer
      map.addLayer({
        id: 'blocks-fill-layer',
        type: 'fill',
        source: 'vineyard-blocks-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4
        }
      })

      // Outline layer
      map.addLayer({
        id: 'blocks-outline-layer',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      map.on('click', 'blocks-fill-layer', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0];
        const blockId = feature.properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });
          
          // Calculate center or use fitBounds if needed. For now just fly to the geometry center roughly if possible.
          // Or we can just use the provided features coordinates if it's a simple polygon.
          // For simplicity we use the first coordinate point if it's a polygon.
          if (blockBase.geom && blockBase.geom.coordinates && blockBase.geom.coordinates[0]) {
             const firstCoord = blockBase.geom.coordinates[0][0];
             map.flyTo({
                center: firstCoord,
                zoom: 16,
                essential: true
              })
          }
        }
      })

      map.on('mouseenter', 'blocks-fill-layer', () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('blocks-fill-layer', 'fill-opacity', 0.6)
      })
      map.on('mouseleave', 'blocks-fill-layer', () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('blocks-fill-layer', 'fill-opacity', 0.4)
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  if (!isMounted || blocksLoading) {
    return (
      <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
            Synchronizing Vineyard Blocks...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden shadow-2xl" />
      
      {selectedBlock && (
        <BlockPanel
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
