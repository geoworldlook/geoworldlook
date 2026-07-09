"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocksGeoJSON, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && !blocksGeoJSON)) return

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
      if (!blocksGeoJSON) return;

      map.addSource('vineyard-data', {
        type: 'geojson',
        data: blocksGeoJSON
      })

      // Add fill layer for the polygons
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4
        }
      })

      // Add outline layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      // Fit bounds to the features
      const bounds = new maplibregl.LngLatBounds();
      blocksGeoJSON.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach((coord: any) => {
            bounds.extend(coord as [number, number]);
          });
        }
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50 });
      }

      // Update click handler for polygons
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const props = e.features[0].properties
        const blockId = props.id
        const feature = e.features[0]
        
        const stats = await getBlockStats(blockId);

        setSelectedBlock({
          id: blockId,
          name: props.name,
          area_ha: props.area_ha,
          geom: feature.geometry,
          stats: stats
        });

        // Zoom to the block
        if (feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0];
          const blockBounds = coordinates.reduce((acc: maplibregl.LngLatBounds, coord: any) => {
            return acc.extend(coord as [number, number]);
          }, new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));
          
          map.fitBounds(blockBounds, { padding: 50 });
        }
      })

      map.on('mouseenter', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('vineyard-fill', 'fill-opacity', 0.6)
      })
      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('vineyard-fill', 'fill-opacity', 0.4)
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksGeoJSON, blocksLoading])

  if (!isMounted || (blocksLoading && !blocksGeoJSON)) {
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
