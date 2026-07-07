
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null)
  const [blockStats, setBlockStats] = useState<VineyardStats[]>([])
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && !blocks)) return

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
      if (blocks) {
        map.addSource('vineyard-blocks', {
          type: 'geojson',
          data: blocks,
          generateId: true
        })

        // Fill layer
        map.addLayer({
          id: 'vineyard-fill',
          type: 'fill',
          source: 'vineyard-blocks',
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

        // Outline layer
        map.addLayer({
          id: 'vineyard-outline',
          type: 'line',
          source: 'vineyard-blocks',
          paint: {
            'line-color': '#ffffff',
            'line-width': 2
          }
        })

        // Fit bounds to blocks
        if (blocks.features.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          blocks.features.forEach((feature: any) => {
            if (feature.geometry.type === 'Polygon') {
              feature.geometry.coordinates[0].forEach((coord: any) => {
                bounds.extend(coord as [number, number]);
              });
            }
          });
          map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
      }

      let hoveredStateId: string | number | null = null;

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id!;
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: true }
          );
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockProps = feature.properties
        
        const stats = await getBlockStats(blockProps.id);
        setSelectedBlock(blockProps);
        setBlockStats(stats);

        // Fly to polygon center/bbox
        const bounds = new maplibregl.LngLatBounds();
        if (feature.geometry.type === 'Polygon') {
          (feature.geometry as any).coordinates[0].forEach((coord: any) => {
            bounds.extend(coord as [number, number]);
          });
          map.fitBounds(bounds, { padding: 100, maxZoom: 16 });
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  if (!isMounted || (blocksLoading && !blocks)) {
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
          stats={blockStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
