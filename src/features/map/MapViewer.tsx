"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/stations'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getVineyardStats } = useVineyardData();
  const blocksRef = useRef<VineyardBlock[]>(blocks);
  blocksRef.current = blocks;

  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true)
    // Expose selection helper for testing
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = (block: VineyardBlock) => {
        setSelectedBlock(block);
      };
    }
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return

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
      // Initialize empty GeoJSON source
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        generateId: true
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
            0.35
          ]
        }
      })

      // Add Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#34d399',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ]
        }
      })

      // Add Block Label Layer
      map.addLayer({
        id: 'vineyard-label',
        type: 'symbol',
        source: 'vineyard-data',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-offset': [0, 0],
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5
        }
      })

      // Hover Interaction handlers
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          const feature = e.features[0]
          hoveredIdRef.current = feature.id ?? null
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          )
        }
        hoveredIdRef.current = null
      })

      // Click Interaction handler
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const timeSeries = await getVineyardStats(blockId)
          const updatedBlock = { ...blockBase, timeSeries }
          setSelectedBlock(updatedBlock)

          // Fit bounds to clicked block polygon
          const bounds = getPolygonBounds(blockBase.geom)
          if (bounds) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 })
          }
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted])

  // Update GeoJSON source when blocks change
  useEffect(() => {
    if (!mapInstance.current || !mapInstance.current.isStyleLoaded()) return

    const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource
    if (source && blocks.length > 0) {
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: blocks.map((b, index) => ({
          type: 'Feature',
          id: index,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      }
      source.setData(geojson)

      // Automatically fit bounds to encompass all vineyard blocks
      const bounds = getAllBlocksBounds(blocks)
      if (bounds) {
        mapInstance.current.fitBounds(bounds, { padding: 60, maxZoom: 14 })
      }
    }
  }, [blocks])

  if (!isMounted || (blocksLoading && blocks.length === 0)) {
    return (
      <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
            Synchronizing Vineyard Parcel Polygons...
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

/**
 * Calculates BoundingBox [sw_lng, sw_lat, ne_lng, ne_lat] for a single polygon geometry.
 */
function getPolygonBounds(geom: any): maplibregl.LngLatBoundsLike | null {
  if (!geom || !geom.coordinates) return null
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

  const processCoords = (coords: any[]) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    } else {
      coords.forEach(processCoords)
    }
  }

  processCoords(geom.coordinates)
  if (minLng === Infinity) return null
  return [[minLng, minLat], [maxLng, maxLat]]
}

/**
 * Calculates overall BoundingBox across all vineyard blocks.
 */
function getAllBlocksBounds(blocks: VineyardBlock[]): maplibregl.LngLatBoundsLike | null {
  if (blocks.length === 0) return null
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

  blocks.forEach(b => {
    if (b.geom && b.geom.coordinates) {
      const processCoords = (coords: any[]) => {
        if (typeof coords[0] === 'number') {
          const [lng, lat] = coords
          if (lng < minLng) minLng = lng
          if (lng > maxLng) maxLng = lng
          if (lat < minLat) minLat = lat
          if (lat > maxLat) maxLat = lat
        } else {
          coords.forEach(processCoords)
        }
      }
      processCoords(b.geom.coordinates)
    }
  })

  if (minLng === Infinity) return null
  return [[minLng, minLat], [maxLng, maxLat]]
}
