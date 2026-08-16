"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStats } from '@/types/database.types'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [selectedBlockStats, setSelectedBlockStats] = useState<VineyardStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  
  const { blocks, geojson, loading: blocksLoading, getBlockStats } = useVineyardData()

  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose testing helper on window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async () => {
        if (blocksRef.current.length > 0) {
          const firstBlock = blocksRef.current[0]
          setSelectedBlock(firstBlock)
          const stats = await getBlockStats(firstBlock.id)
          setSelectedBlockStats(stats)
        }
      }
    }
  }, [getBlockStats])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return
    if (blocksLoading && blocks.length === 0) return

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
      const sourceData = geojson || {
        type: 'FeatureCollection',
        features: blocks.map((b) => ({
          type: 'Feature',
          id: b.id,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      }

      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: sourceData,
        generateId: true
      })

      // Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#34d399',
            '#10b981'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.35
          ]
        }
      })

      // Polygon Outline / Border Layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ],
          'line-opacity': 0.9
        }
      })

      // Fit bounds to polygon features if present
      if (sourceData.features && sourceData.features.length > 0) {
        try {
          const bounds = new maplibregl.LngLatBounds()
          let hasCoords = false

          const processCoords = (coords: any) => {
            if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
              bounds.extend([coords[0], coords[1]] as [number, number])
              hasCoords = true
            } else if (Array.isArray(coords)) {
              coords.forEach(processCoords)
            }
          }

          sourceData.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
              processCoords(feature.geometry.coordinates)
            }
          })

          if (hasCoords) {
            map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 })
          }
        } catch (e) {
          console.warn('Could not calculate bounds for map fit:', e)
        }
      }

      // Feature Hovering Interaction
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          hoveredIdRef.current = e.features[0].id ?? null
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })

      // Polygon Selection on Click
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties?.id
        const blockName = feature.properties?.name
        const areaHa = feature.properties?.area_ha

        const currentBlocks = blocksRef.current
        const matchedBlock = currentBlocks.find(b => b.id === blockId) || {
          id: blockId,
          name: blockName || 'Vineyard Block',
          area_ha: areaHa ? Number(areaHa) : 0,
          geom: feature.geometry
        }

        setStatsLoading(true)
        setSelectedBlock(matchedBlock)

        const stats = await getBlockStats(blockId)
        setSelectedBlockStats(stats)
        setStatsLoading(false)

        // Center map on block centroid
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          const coords = (feature.geometry as any).coordinates[0]
          if (coords && coords.length > 0) {
            let sumLng = 0, sumLat = 0
            coords.forEach((c: number[]) => {
              sumLng += c[0]
              sumLat += c[1]
            })
            const centerLng = sumLng / coords.length
            const centerLat = sumLat / coords.length
            map.flyTo({ center: [centerLng, centerLat], zoom: 14, essential: true })
          }
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksLoading])

  // Update source data when blocks or geojson change dynamically
  useEffect(() => {
    if (!mapInstance.current) return
    const source = mapInstance.current.getSource('vineyard-blocks-data') as maplibregl.GeoJSONSource
    if (source) {
      const sourceData = geojson || {
        type: 'FeatureCollection',
        features: blocks.map((b) => ({
          type: 'Feature',
          id: b.id,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      }
      source.setData(sourceData)
    }
  }, [blocks, geojson])

  if (!isMounted || (blocksLoading && blocks.length === 0)) {
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
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
