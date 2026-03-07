
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import StationPanel from './components/StationPanel'
import { Station } from '@/types/stations'
import { useStationData } from '@/hooks/use-station-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  
  const { stations: blocks, loading: blocksLoading, getStationStats: getBlockStats } = useStationData();

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
      // 1. Dodajemy źródło z poligonami (GeoJSON)
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            id: b.id, // Ważne dla interakcji
            geometry: b.geometry,
            properties: {
              id: b.id,
              name: b.name,
              area: b.area_ha
            }
          }))
        }
      })

      // 2. Warstwa wypełnienia poligonów (Fill)
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

      // 3. Warstwa obrysu (Line)
      map.addLayer({
        id: 'blocks-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // Kliknięcie w poligon
      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties!.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedStation({ ...blockBase, timeSeries });
          
          // Automatyczne dopasowanie do granic poligonu
          const coordinates = (blockBase.geometry.coordinates[0] as [number, number][]);
          const bounds = coordinates.reduce((acc, coord) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

          map.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      })

      // Interakcje kursora
      let hoveredStateId: string | number | null = null;
      map.on('mousemove', 'blocks-fill', (e) => {
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

      map.on('mouseleave', 'blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
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
      
      {selectedStation && (
        <StationPanel 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />
      )}
    </div>
  )
}
