"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyard'
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
  
  const { blocksGeoJSON, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || blocksLoading || !blocksGeoJSON) return

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
        data: blocksGeoJSON,
        generateId: true // Required for feature-state
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
            0.6,
            0.3
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
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1
          ]
        }
      })

      // Fitting map to blocks if they exist
      if (blocksGeoJSON.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        blocksGeoJSON.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach((coord: [number, number]) => {
              bounds.extend(coord)
            })
          }
        })
        map.fitBounds(bounds, { padding: 50, maxZoom: 15 })
      }

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredBlockId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredBlockId },
              { hover: false }
            )
          }
          const newHoveredId = e.features[0].id as string
          setHoveredBlockId(newHoveredId)
          map.setFeatureState(
            { source: 'vineyard-blocks', id: newHoveredId },
            { hover: true }
          )
          map.getCanvas().style.cursor = 'pointer'
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredBlockId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredBlockId },
            { hover: false }
          )
        }
        setHoveredBlockId(null)
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const props = e.features[0].properties
        const stats = await getBlockStats(props.id);

        setSelectedBlock({
          id: props.id,
          name: props.name,
          area_ha: props.area_ha,
          geom: e.features[0].geometry,
          stats: stats
        });
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksGeoJSON, blocksLoading])

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
