"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockProperties, VineyardStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Helper function to recursively extract coordinates from standard GeoJSON Geometry objects
function processCoords(coords: any, points: [number, number][]) {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    points.push([coords[0], coords[1]]);
  } else {
    for (const child of coords) {
      processCoords(child, points);
    }
  }
}

function calculateBounds(features: any[]): [[number, number], [number, number]] | null {
  const points: [number, number][] = [];

  features.forEach(f => {
    const geom = f.geometry || f.geom;
    if (geom && geom.coordinates) {
      processCoords(geom.coordinates, points);
    }
  });

  if (points.length === 0) return null;

  let minLng = points[0][0];
  let maxLng = points[0][0];
  let minLat = points[0][1];
  let maxLat = points[0][1];

  points.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });

  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<
    (VineyardBlockProperties & { timeSeries: VineyardStats[] }) | null
  >(null)

  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  const blocksRef = useRef(blocks)
  blocksRef.current = blocks

  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
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
      // Add GeoJSON source with generateId enabled for hover state tracking
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        generateId: true,
        data: {
          type: 'FeatureCollection',
          features: blocksRef.current
        }
      })

      // Polygon fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
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

      // Polygon line outline layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#059669',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      })

      // Fit map bounds to vineyard blocks if available
      const bounds = calculateBounds(blocksRef.current)
      if (bounds) {
        map.fitBounds(bounds, { padding: 60, duration: 1000 })
      }

      // Handle polygon click
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties?.id || feature.id

        const blockFeature = blocksRef.current.find(
          b => b.id === blockId || b.properties?.id === blockId
        )

        const props = blockFeature?.properties || feature.properties

        if (props) {
          const stats = await getBlockStats(props.id)
          setSelectedBlock({
            id: props.id,
            name: props.name || 'Vineyard Block',
            area_ha: props.area_ha || 0,
            created_at: props.created_at,
            timeSeries: stats
          })

          // Fit bounds to clicked polygon
          const blockBounds = calculateBounds([feature])
          if (blockBounds) {
            map.fitBounds(blockBounds, { padding: 100, maxZoom: 16, duration: 800 })
          }
        }
      })

      // Handle hover interactions
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const featureId = e.features[0].id

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          if (featureId !== undefined) {
            hoveredIdRef.current = featureId
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: featureId },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })
    })

    // Expose test hook for verification if needed
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const block = blocksRef.current.find(b => b.id === blockId || b.properties?.id === blockId)
        if (block) {
          const stats = await getBlockStats(block.properties.id)
          setSelectedBlock({
            ...block.properties,
            timeSeries: stats
          })
        }
      }
    }

    return () => {
      map.remove()
    }
  }, [isMounted])

  // Update source data dynamically without re-initializing map when blocks load
  useEffect(() => {
    if (!mapInstance.current) return
    const map = mapInstance.current

    if (map.isStyleLoaded()) {
      const source = map.getSource('vineyard-blocks-source') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: blocks
        })
        const bounds = calculateBounds(blocks)
        if (bounds) {
          map.fitBounds(bounds, { padding: 60, duration: 800 })
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
            Synchronizing Vineyard Polygons...
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
