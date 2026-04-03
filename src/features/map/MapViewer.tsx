"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockFeature, VineyardStat } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockFeature | null>(null)
  const [selectedBlockStats, setSelectedBlockStats] = useState<VineyardStat[]>([])
  
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
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: blocks,
        generateId: true // Essential for feature states
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
            0.5,
            0.2
          ]
        }
      })

      // Polygon outline layer
      map.addLayer({
        id: 'blocks-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      let hoveredStateId: string | number | null = null;

      map.on('mousemove', 'blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
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
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'blocks-fill', () => {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0] as unknown as VineyardBlockFeature
        const blockId = feature.properties.id

        const stats = await getBlockStats(blockId);
        setSelectedBlock(feature);
        setSelectedBlockStats(stats);
        
        // Fit map to polygon
        if (feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0];
          const bounds = coordinates.reduce((acc, coord) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));
          
          map.fitBounds(bounds, { padding: 50 });
        }
      })

      // If blocks are loaded, fit map to all blocks
      if (blocks.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.features.forEach(f => {
          if (f.geometry.type === 'Polygon') {
            f.geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord as [number, number]);
            });
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
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
          stats={selectedBlockStats}
          onClose={() => {
            setSelectedBlock(null);
            setSelectedBlockStats([]);
          }}
        />
      )}
    </div>
  )
}
