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

/**
 * Helper to recursively extract coordinates from standard GeoJSON Geometry objects or arrays
 * and calculate bounds [minLng, minLat, maxLng, maxLat].
 */
function processCoords(obj: any, bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
  if (!obj) return;
  if (obj.geometry) {
    processCoords(obj.geometry, bounds);
    return;
  }
  if (obj.coordinates) {
    processCoords(obj.coordinates, bounds);
    return;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number') {
      const [lng, lat] = obj;
      if (lng < bounds.minLng) bounds.minLng = lng;
      if (lng > bounds.maxLng) bounds.maxLng = lng;
      if (lat < bounds.minLat) bounds.minLat = lat;
      if (lat > bounds.maxLat) bounds.maxLat = lat;
    } else {
      for (const item of obj) {
        processCoords(item, bounds);
      }
    }
  }
}

function calculateBounds(blocks: VineyardBlock[]): maplibregl.LngLatBoundsLike | null {
  const bounds = {
    minLng: Infinity,
    minLat: Infinity,
    maxLng: -Infinity,
    maxLat: -Infinity,
  };

  for (const block of blocks) {
    if (block.geom) {
      processCoords(block.geom, bounds);
    }
  }

  if (bounds.minLng === Infinity || bounds.minLat === Infinity) {
    return null;
  }

  return [
    [bounds.minLng, bounds.minLat],
    [bounds.maxLng, bounds.maxLat],
  ];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)

  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  const blocksRef = useRef<VineyardBlock[]>(blocks)
  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test hook for automated verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find((b) => b.id === blockId)
        if (found) {
          const timeSeries = await getBlockStats(blockId)
          setSelectedBlock({ ...found, timeSeries })
          return true
        }
        return false
      }
    }
  }, [getBlockStats])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return
    if (mapInstance.current) return // Prevent duplicate map initialization

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
      const featureCollection = {
        type: 'FeatureCollection',
        features: blocksRef.current.map((b) => ({
          type: 'Feature',
          id: b.id,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha,
          },
        })),
      }

      map.addSource('vineyard-data', {
        type: 'geojson',
        data: featureCollection as any,
        generateId: true,
      })

      // Add Polygon Fill Layer
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
            0.35,
          ],
        },
      })

      // Add Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2,
          ],
        },
      })

      // Auto fit bounds if blocks exist
      if (blocksRef.current.length > 0) {
        const bBounds = calculateBounds(blocksRef.current)
        if (bBounds) {
          map.fitBounds(bBounds, { padding: 60, maxZoom: 15 })
        }
      }

      // Feature hover events
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features[0]
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          )
        }
        hoveredIdRef.current = feature.id ?? null
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
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

      // Block click event
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const clickedPropId = e.features[0].properties.id
        const blockBase = blocksRef.current.find((b) => b.id === clickedPropId)

        if (blockBase) {
          const timeSeries = await getBlockStats(clickedPropId)
          setSelectedBlock({ ...blockBase, timeSeries })

          const blockBounds = calculateBounds([blockBase])
          if (blockBounds) {
            map.fitBounds(blockBounds, { padding: 80, maxZoom: 16 })
          }
        }
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Update source data if blocks update after map initialization
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded()) {
      const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource
      if (source) {
        const featureCollection = {
          type: 'FeatureCollection',
          features: blocks.map((b) => ({
            type: 'Feature',
            id: b.id,
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha,
            },
          })),
        }
        source.setData(featureCollection as any)

        const bBounds = calculateBounds(blocks)
        if (bBounds) {
          mapInstance.current.fitBounds(bBounds, { padding: 60, maxZoom: 15 })
        }
      }
    }
  }, [blocks])

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
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
