"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

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

    let hoveredId: string | null = null

    // Expose testing selection hook on window
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocks.find(b => b.id === blockId) || blocks[0]
        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.id)
          setSelectedBlock({ ...blockBase, timeSeries })
        }
      }
    }

    map.on('load', () => {
      // Build GeoJSON FeatureCollection from vineyard blocks
      const geojsonFeatures = blocks.map(b => {
        return {
          type: 'Feature' as const,
          id: b.id,
          geometry: b.geom || {
            type: 'Polygon',
            coordinates: [[
              [15.505, 51.935],
              [15.512, 51.937],
              [15.515, 51.932],
              [15.507, 51.930],
              [15.505, 51.935]
            ]]
          },
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }
      })

      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures
        },
        generateId: true
      })

      // Add Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#34d399', // Bright emerald on hover
            '#10b981'  // Standard emerald fill
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.65,
            0.4
          ]
        }
      })

      // Add Polygon Outline Border Layer
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#059669',
          'line-width': 2.5
        }
      })

      // Fit map bounds to encompass all vineyard polygons
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        blocks.forEach(b => {
          const coords = b.geom?.coordinates?.[0]
          if (coords) {
            coords.forEach((pt: [number, number]) => bounds.extend(pt))
          }
        })
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 })
        }
      }

      // Handle hover interactions
      map.on('mousemove', 'vineyard-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        if (e.features && e.features.length > 0) {
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredId },
              { hover: false }
            )
          }
          const feature = e.features[0]
          hoveredId = feature.id as string
          if (hoveredId !== undefined) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredId },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredId },
            { hover: false }
          )
        }
        hoveredId = null
      })

      // Handle click interactions on vineyard blocks
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocks.find(b => b.id === blockId)

        if (blockBase) {
          const timeSeries = await getBlockStats(blockId)
          setSelectedBlock({ ...blockBase, timeSeries })

          // Fit map bounds to selected block polygon
          const coords = blockBase.geom?.coordinates?.[0]
          if (coords) {
            const blockBounds = new maplibregl.LngLatBounds()
            coords.forEach((pt: [number, number]) => blockBounds.extend(pt))
            map.fitBounds(blockBounds, { padding: 120, maxZoom: 16, duration: 1200 })
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
            Synchronizing Vineyard Parcels...
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
