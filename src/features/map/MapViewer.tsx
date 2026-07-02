
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStat } from '@/types/database.types'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<{ block: VineyardBlock, stats: VineyardStat[] } | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && blocks.length === 0)) return

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
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            id: b.id,
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        }
      })

      // Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.5,
            0.2
          ]
        }
      })

      // Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const block = blocks.find(b => b.id === blockId)
        
        if (block) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ block, stats });
          
          // Calculate center of polygon for flyTo
          // (Simple bounding box center)
          if (block.geom.type === 'Polygon') {
             const coords = block.geom.coordinates[0];
             const bounds = coords.reduce((acc: any, curr: any) => [
                Math.min(acc[0], curr[0]),
                Math.min(acc[1], curr[1]),
                Math.max(acc[2], curr[0]),
                Math.max(acc[3], curr[1])
             ], [Infinity, Infinity, -Infinity, -Infinity]);

             map.flyTo({
                center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
                zoom: 14,
                essential: true
             });
          }
        }
      })

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredBlockId },
              { hover: false }
            )
          }
          const id = e.features[0].id as string
          setHoveredBlockId(id)
          map.setFeatureState(
            { source: 'vineyard-blocks', id: id },
            { hover: true }
          )
          map.getCanvas().style.cursor = 'pointer'
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredBlockId) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredBlockId },
            { hover: false }
          )
        }
        setHoveredBlockId(null)
        map.getCanvas().style.cursor = ''
      })

      // Fit bounds to blocks if they exist
      if (blocks.length > 0) {
        const allCoords = blocks.flatMap(b =>
          b.geom.type === 'Polygon' ? b.geom.coordinates[0] : []
        );
        if (allCoords.length > 0) {
          const bounds = allCoords.reduce((acc: any, curr: any) => [
            Math.min(acc[0], curr[0]),
            Math.min(acc[1], curr[1]),
            Math.max(acc[2], curr[0]),
            Math.max(acc[3], curr[1])
          ], [Infinity, Infinity, -Infinity, -Infinity]);

          map.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], {
            padding: 50,
            maxZoom: 12
          });
        }
      }
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  if (!isMounted || (blocksLoading && blocks.length === 0)) {
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
          block={selectedBlock.block}
          stats={selectedBlock.stats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
