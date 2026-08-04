"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStat } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function getPolygonCenterAndBounds(geom: any) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  let sumLng = 0, sumLat = 0, count = 0;

  function processCoords(coords: any) {
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      for (const coord of coords) {
        const [lng, lat] = coord;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        sumLng += lng;
        sumLat += lat;
        count++;
      }
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        processCoords(item);
      }
    }
  }

  if (geom && geom.coordinates) {
    processCoords(geom.coordinates);
  }

  if (count === 0) {
    return {
      center: [15.5, 51.9] as [number, number],
      bounds: [[15.48, 51.88], [15.57, 51.93]] as [[number, number], [number, number]]
    };
  }

  return {
    center: [sumLng / count, sumLat / count] as [number, number],
    bounds: [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]]
  };
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [blockStats, setBlockStats] = useState<VineyardStat[]>([])

  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Keep references to state inside MapLibre event handlers to avoid stale closures
  const blocksRef = useRef<VineyardBlock[]>([])
  const hoveredIdRef = useRef<any>(null)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize Map
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
      // Add Vineyard GeoJSON source with generateId enabled for feature-state hover handling
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map((b, index) => ({
            type: 'Feature',
            id: index, // unique numeric ID for feature state
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        },
        generateId: true
      })

      // Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-source',
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

      // Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // Polygon Labels Layer
      map.addLayer({
        id: 'vineyard-label',
        type: 'symbol',
        source: 'vineyard-source',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1.5,
          'text-opacity': 0.9
        }
      })

      // Automatically focus/fit map bounds on loaded vineyard data (Poland)
      if (blocks.length > 0) {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        blocks.forEach(b => {
          const { bounds } = getPolygonCenterAndBounds(b.geom);
          minLng = Math.min(minLng, bounds[0][0]);
          minLat = Math.min(minLat, bounds[0][1]);
          maxLng = Math.max(maxLng, bounds[1][0]);
          maxLat = Math.max(maxLat, bounds[1][1]);
        });
        if (minLng !== Infinity) {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 80,
            maxZoom: 13,
            duration: 1500
          });
        }
      }

      // Handle Vineyard Fill Clicks
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return

        // Retrieve business-level ID from feature's properties
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock(blockBase)
          setBlockStats(stats)

          const { bounds } = getPolygonCenterAndBounds(blockBase.geom)
          map.fitBounds(bounds, {
            padding: 100,
            maxZoom: 14,
            duration: 1000
          })
        }
      })

      // Handle Vineyard Hover State (feature-state)
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'

          const feature = e.features[0]
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-source', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          hoveredIdRef.current = feature.id
          map.setFeatureState(
            { source: 'vineyard-source', id: feature.id },
            { hover: true }
          )
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksLoading])

  // Optimize block updates using source.setData() without reinitializing the map
  useEffect(() => {
    if (mapInstance.current && !blocksLoading) {
      const source = mapInstance.current.getSource('vineyard-source') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
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
        })
      }
    }
  }, [blocks, blocksLoading])

  // Expose test hook window.selectBlockForTesting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId)
        if (blockBase) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock(blockBase)
          setBlockStats(stats)

          if (mapInstance.current) {
            const { bounds } = getPolygonCenterAndBounds(blockBase.geom)
            mapInstance.current.fitBounds(bounds, {
              padding: 100,
              maxZoom: 14,
              duration: 1000
            })
          }
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting
      }
    }
  }, [getBlockStats])

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
          stats={blockStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
