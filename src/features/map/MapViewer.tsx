
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStat } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [blockStats, setBlockStats] = useState<VineyardStat[]>([])
  
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
      // Add source for vineyard blocks (polygons)
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            id: b.id, // Important for feature-state
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        }
      })

      // Polygon fill layer
      map.addLayer({
        id: 'blocks-fill',
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

      // Polygon outline layer
      map.addLayer({
        id: 'blocks-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1
          ]
        }
      })

      let hoveredBlockId: string | number | null = null;

      map.on('mousemove', 'blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredBlockId },
              { hover: false }
            );
          }
          hoveredBlockId = e.features[0].id ?? null;
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredBlockId },
              { hover: true }
            );
          }
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'blocks-fill', () => {
        if (hoveredBlockId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredBlockId },
            { hover: false }
          );
        }
        hoveredBlockId = null;
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setBlockStats(stats);
          setSelectedBlock(blockBase);
          
          // Fit map to polygon
          const coordinates = (blockBase.geom as any).coordinates[0];
          const bounds = coordinates.reduce((acc: maplibregl.LngLatBounds, coord: [number, number]) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

          map.fitBounds(bounds, { padding: 100 });
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
