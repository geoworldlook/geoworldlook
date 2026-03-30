
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
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
            id: b.id, // Set feature id for feature-state
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

      // Polygon border layer
      map.addLayer({
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      let hoveredStateId: string | null = null;

      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id as string;
          if (hoveredStateId) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredStateId },
              { hover: true }
            );
          }
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });
          
          // Fit bounds to polygon
          if (blockBase.geom && blockBase.geom.coordinates) {
            const coordinates = blockBase.geom.coordinates[0];
            const bounds = coordinates.reduce((acc: maplibregl.LngLatBounds, coord: [number, number]) => {
              return acc.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

            map.fitBounds(bounds, { padding: 50, duration: 1000 });
          }
        }
      })

      // If we have blocks, fit map to them initially
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.forEach(b => {
          if (b.geom && b.geom.coordinates) {
            b.geom.coordinates[0].forEach((coord: [number, number]) => {
              bounds.extend(coord);
            });
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50, animate: false });
        }
      }
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
