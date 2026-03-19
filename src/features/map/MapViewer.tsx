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
        data: blocksGeoJSON
      })

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

      map.addLayer({
        id: 'blocks-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      // Zoom to fit blocks
      if (blocksGeoJSON.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        blocksGeoJSON.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord as [number, number])
            })
          }
        })
        map.fitBounds(bounds, { padding: 100, maxZoom: 14 })
      }

      let hoveredBlockId: string | null = null

      map.on('mousemove', 'blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredBlockId !== null) {
             map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredBlockId },
              { hover: false }
            )
          }
          hoveredBlockId = e.features[0].id as string
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredBlockId },
            { hover: true }
          )
        }
      })

      map.on('mouseleave', 'blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredBlockId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredBlockId },
            { hover: false }
          )
        }
        hoveredBlockId = null
      })

      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties.id

        const stats = await getBlockStats(blockId);
        setSelectedBlock({
          id: blockId,
          name: feature.properties.name,
          area_ha: feature.properties.area_ha,
          stats: stats
        });

        if (feature.geometry.type === 'Polygon') {
           const bounds = new maplibregl.LngLatBounds()
           feature.geometry.coordinates[0].forEach((coord: any) => {
             bounds.extend(coord as [number, number])
           })
           map.fitBounds(bounds, { padding: 150, duration: 1000 })
        }
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
