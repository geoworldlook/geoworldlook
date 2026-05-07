
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
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  
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
      map.addSource('vineyard-data', {
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
        },
        generateId: true
      })

      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-data',
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

      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0];
        const blockId = feature.properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });

          // Calculate centroid of the polygon for flyTo
          const coordinates = blockBase.geom.coordinates[0];
          const bounds = coordinates.reduce((acc: maplibregl.LngLatBounds, coord: number[]) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
          
          map.flyTo({
            center: bounds.getCenter(),
            zoom: 14,
            essential: true
          })
        }
      })

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredBlockId },
              { hover: false }
            );
          }
          const id = e.features[0].id as string;
          setHoveredBlockId(id);
          map.setFeatureState(
            { source: 'vineyard-data', id: id },
            { hover: true }
          );
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredBlockId !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredBlockId },
            { hover: false }
          );
        }
        setHoveredBlockId(null);
        map.getCanvas().style.cursor = '';
      });

      // Fit bounds to all blocks
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.forEach(b => {
          b.geom.coordinates[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
        });
        map.fitBounds(bounds, { padding: 50 });
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
