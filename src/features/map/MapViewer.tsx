"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Recursive function to extract all [lng, lat] coordinate pairs from GeoJSON geometry
function getCoords(geom: any): [number, number][] {
  const coords: [number, number][] = []
  const process = (arr: any) => {
    if (Array.isArray(arr) && arr.length === 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      coords.push(arr as [number, number])
    } else if (Array.isArray(arr)) {
      for (const item of arr) {
        process(item)
      }
    }
  }
  process(geom)
  return coords
}

function getBoundsAndCentroid(geom: any) {
  const coords = getCoords(geom)
  if (coords.length === 0) return null

  let minLng = coords[0][0]
  let maxLng = coords[0][0]
  let minLat = coords[0][1]
  let maxLat = coords[0][1]

  let sumLng = 0
  let sumLat = 0

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    sumLng += lng
    sumLat += lat
  }

  const centroid: [number, number] = [sumLng / coords.length, sumLat / coords.length]
  const bounds: [[number, number], [number, number]] = [[minLng, minLat], [maxLng, maxLat]]

  return { bounds, centroid }
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [selectedBlockStats, setSelectedBlockStats] = useState<VineyardStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  const blocksRef = useRef<VineyardBlock[]>([])
  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  // Common function to select a block, fetch its stats, and center/zoom to it
  const handleSelectBlock = useCallback(async (block: VineyardBlock) => {
    setSelectedBlock(block)
    setStatsLoading(true)
    try {
      const stats = await getBlockStats(block.id)
      setSelectedBlockStats(stats)
    } catch (err) {
      console.error('[GeoWorldLook] Error loading stats for block:', err)
    } finally {
      setStatsLoading(false)
    }

    const info = getBoundsAndCentroid(block.geom)
    if (info && mapInstance.current) {
      mapInstance.current.flyTo({
        center: info.centroid,
        zoom: 14,
        essential: true
      })
    }
  }, [getBlockStats])

  // Expose test hook on window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId)
        if (found) {
          handleSelectBlock(found)
        } else {
          console.warn(`[GeoWorldLook Testing] Block with id ${blockId} not found`)
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting
      }
    }
  }, [handleSelectBlock])

  // Helper to generate standard FeatureCollection from blocks list
  const getGeoJSONData = useCallback((blocksList: VineyardBlock[]) => {
    return {
      type: 'FeatureCollection' as const,
      features: blocksList.map(b => ({
        type: 'Feature' as const,
        id: b.id, // Top-level id (can be overwritten/ignored by MapLibre internally when generateId: true is enabled)
        geometry: b.geom,
        properties: {
          id: b.id, // Store business-level id under properties
          name: b.name,
          area_ha: b.area_ha
        }
      }))
    }
  }, [])

  // Initialize Map
  useEffect(() => {
    // Check if loading and blocks list is completely empty, to defer map initialization
    if (!isMounted || !mapContainer.current || (blocksLoading && blocks.length === 0)) return

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
      // Add source with generateId: true
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: getGeoJSONData(blocks),
        generateId: true
      })

      // Add fill layer with dynamic hover opacity
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6, // Hover opacity
            0.35 // Default opacity
          ]
        }
      })

      // Add stroke layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // Hover event listeners
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features[0]
        const featureId = feature.id // internal numeric id generated by MapLibre

        if (featureId !== undefined) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          hoveredIdRef.current = featureId
          map.setFeatureState(
            { source: 'vineyard-data', id: featureId },
            { hover: true }
          )
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })

      // Click event listener
      map.on('click', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        // Retrieve business-level ID from feature properties (as MapLibre might overwrite feature.id)
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          handleSelectBlock(blockBase)
        }
      })

      // Adjust bounds to fit all blocks
      if (blocks.length > 0) {
        const allCoords = blocks.flatMap(b => getCoords(b.geom))
        if (allCoords.length > 0) {
          let minLng = allCoords[0][0]
          let maxLng = allCoords[0][0]
          let minLat = allCoords[0][1]
          let maxLat = allCoords[0][1]

          for (const [lng, lat] of allCoords) {
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
          }

          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 50,
            maxZoom: 14,
            duration: 1000
          })
        }
      }
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted, blocksLoading]) // Depend on blocksLoading to defer initial load

  // Handle subsequent data updates via source.setData() without re-creating the map
  useEffect(() => {
    const map = mapInstance.current
    if (map && map.isStyleLoaded() && map.getSource('vineyard-data')) {
      const source = map.getSource('vineyard-data') as maplibregl.GeoJSONSource
      source.setData(getGeoJSONData(blocks))

      // Adjust map bounds if blocks updated and there is no selected block
      if (blocks.length > 0 && !selectedBlock) {
        const allCoords = blocks.flatMap(b => getCoords(b.geom))
        if (allCoords.length > 0) {
          let minLng = allCoords[0][0]
          let maxLng = allCoords[0][0]
          let minLat = allCoords[0][1]
          let maxLat = allCoords[0][1]

          for (const [lng, lat] of allCoords) {
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
          }

          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 50,
            maxZoom: 14,
            duration: 800
          })
        }
      }
    }
  }, [blocks, selectedBlock, getGeoJSONData])

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
          loading={statsLoading}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
