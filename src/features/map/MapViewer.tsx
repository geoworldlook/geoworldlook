"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import StationPanel from './components/StationPanel'
import { VineyardBlockData } from '@/types/stations'
import { useStationData } from '@/hooks/use-station-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockData | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useStationData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test helper for programmatic verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocks.find(b => b.id === blockId) || blocks[0];
        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.id);
          setSelectedBlock({ ...blockBase, timeSeries });
          if (mapInstance.current && blockBase.coordinates[0]) {
            const coords = blockBase.coordinates[0];
            const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
            const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
            mapInstance.current.flyTo({ center: [avgLng, avgLat], zoom: 13, essential: true });
          }
        }
      };
    }
  }, [blocks, getBlockStats]);

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
            geometry: {
              type: 'Polygon',
              coordinates: b.coordinates
            },
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        }
      })

      // Poligon Fill Layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4
        }
      })

      // Poligon Outline Layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.9
        }
      })

      // Fit bounds to vineyard blocks if available
      if (blocks.length > 0 && blocks[0].coordinates[0]) {
        const allCoords = blocks.flatMap(b => b.coordinates[0] || []);
        if (allCoords.length > 0) {
          const bounds = allCoords.reduce(
            (acc, coord) => [
              Math.min(acc[0], coord[0]),
              Math.min(acc[1], coord[1]),
              Math.max(acc[2], coord[0]),
              Math.max(acc[3], coord[1])
            ],
            [allCoords[0][0], allCoords[0][1], allCoords[0][0], allCoords[0][1]]
          );
          map.fitBounds(bounds as [number, number, number, number], { padding: 50, maxZoom: 14 });
        }
      }

      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });
          
          // Calculate centroid of first ring of coordinates
          const coords = blockBase.coordinates[0];
          if (coords && coords.length > 0) {
            const avgLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
            const avgLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;

            map.flyTo({
              center: [avgLng, avgLat],
              zoom: 13,
              essential: true
            })
          }
        }
      })

      map.on('mouseenter', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
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
        <StationPanel 
          block={selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
