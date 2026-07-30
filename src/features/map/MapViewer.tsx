"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function getCoordinates(geom: any): [number, number][] {
  const coords: [number, number][] = []
  function process(val: any) {
    if (Array.isArray(val)) {
      if (val.length === 2 && typeof val[0] === 'number' && typeof val[1] === 'number') {
        coords.push(val as [number, number])
      } else {
        for (const item of val) {
          process(item)
        }
      }
    }
  }
  process(geom)
  return coords
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Refs for map event handlers to avoid closure issues
  const blocksRef = useRef<VineyardBlock[]>([])
  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Function to handle block selection (shared between click handler and window test hook)
  const handleSelectBlock = async (blockId: string, mapObj?: maplibregl.Map) => {
    const currentMap = mapObj || mapInstance.current
    const blockBase = blocksRef.current.find(b => b.id === blockId)

    if (blockBase && currentMap) {
      const timeSeries = await getBlockStats(blockId)
      setSelectedBlock({ ...blockBase, timeSeries })

      const coords = getCoordinates(blockBase.geom)
      if (coords.length > 0) {
        let minLng = coords[0][0], maxLng = coords[0][0]
        let minLat = coords[0][1], maxLat = coords[0][1]
        for (const [lng, lat] of coords) {
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
        }

        currentMap.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 80, maxZoom: 15, duration: 1500 }
        )
      }
    }
  }

  // Expose test hook
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = (blockId: string) => {
        handleSelectBlock(blockId)
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting
      }
    }
  }, [blocks])

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
      // 1. Prepare geojson
      const geojson: any = {
        type: 'FeatureCollection',
        features: blocks.map(b => ({
          type: 'Feature',
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      }

      // 2. Add source
      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: geojson,
        generateId: true
      })

      // 3. Add fill layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
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

      // 4. Add outline layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // 5. Fit bounds to all blocks initially if we have coordinates
      const allCoords = blocks.flatMap(b => getCoordinates(b.geom))
      if (allCoords.length > 0) {
        let minLng = allCoords[0][0], maxLng = allCoords[0][0]
        let minLat = allCoords[0][1], maxLat = allCoords[0][1]
        for (const [lng, lat] of allCoords) {
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
        }
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, maxZoom: 14, animate: false })
      }

      // 6. Interactive Events
      map.on('click', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        handleSelectBlock(blockId, map)
      })

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return

        map.getCanvas().style.cursor = 'pointer'

        const internalId = e.features[0].id
        if (internalId !== undefined && internalId !== hoveredIdRef.current) {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          hoveredIdRef.current = internalId
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: internalId },
            { hover: true }
          )
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''

        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
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
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest animate-pulse">
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
