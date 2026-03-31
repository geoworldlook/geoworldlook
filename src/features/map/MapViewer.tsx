
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardBlockWithStats } from '@/types/vineyard'
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
      // Fit map to blocks on load
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.forEach(b => {
          const geometry = typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom;
          if (geometry && geometry.coordinates) {
            // Handle Polygon (nested arrays)
            geometry.coordinates.forEach((ring: any) => {
              ring.forEach((coord: [number, number]) => {
                bounds.extend(coord);
              });
            });
          }
        });
        map.fitBounds(bounds, { padding: 50, animate: false });
      }

      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            id: b.id,
            geometry: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        }
      })

      // Add polygon fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
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

      // Add polygon outline layer
      map.addLayer({
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      let hoveredBlockId: string | number | null = null;

      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredBlockId },
              { hover: false }
            );
          }
          hoveredBlockId = e.features[0].id ?? null;
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredBlockId },
              { hover: true }
            );
          }
          map.getCanvas().style.cursor = 'pointer'
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        if (hoveredBlockId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredBlockId },
            { hover: false }
          );
        }
        hoveredBlockId = null;
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocks.find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });

          // Fit map to polygon bounds
          const geometry = typeof blockBase.geom === 'string' ? JSON.parse(blockBase.geom) : blockBase.geom;
          if (geometry && geometry.coordinates) {
             const bounds = new maplibregl.LngLatBounds();
             geometry.coordinates.forEach((ring: any) => {
               ring.forEach((coord: [number, number]) => {
                 bounds.extend(coord);
               });
             });
             map.fitBounds(bounds, { padding: 50, duration: 1000 });
          }
        }
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
            Synchronizing Vineyard Polygons...
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
