"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Recursive function to handle nested arrays in GeoJSON geometries
function processCoords(
  coords: any,
  onCoord: (coord: [number, number]) => void
) {
  if (Array.isArray(coords) && coords.length > 0) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      onCoord(coords as [number, number]);
    } else {
      coords.forEach((c) => processCoords(c, onCoord));
    }
  }
}

// Bounding box and centroid calculations
function getBoundsAndCentroid(geojson: any) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let count = 0;
  let sumLng = 0;
  let sumLat = 0;

  if (geojson && geojson.features) {
    geojson.features.forEach((f: any) => {
      if (f.geometry && f.geometry.coordinates) {
        processCoords(f.geometry.coordinates, ([lng, lat]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          sumLng += lng;
          sumLat += lat;
          count++;
        });
      }
    });
  }

  if (count === 0) {
    return {
      bounds: null,
      centroid: MAP_CONFIG.center as [number, number]
    };
  }

  return {
    bounds: [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]],
    centroid: [sumLng / count, sumLat / count] as [number, number]
  };
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockWithStats | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Refs to prevent stale closure issues in MapLibre event cycle
  const blocksRef = useRef<any>(null)
  const hoveredIdRef = useRef<string | number | null>(null)
  const hasFittedBoundsRef = useRef(false)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && (!blocks || blocks.length === 0))) return

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
      // Add standard GeoJSON source with generateId enabled
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: blocks || { type: 'FeatureCollection', features: [] },
        generateId: true
      })

      // Add vineyard-fill layer
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
            0.3
          ]
        }
      })

      // Add outline layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // Hover effect: set hover state based on MapLibre internal generated ID
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const featureId = e.features[0].id

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          hoveredIdRef.current = featureId ?? null
          if (featureId !== undefined) {
            map.setFeatureState(
              { source: 'vineyard-data', id: featureId },
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
          hoveredIdRef.current = null
        }
      })

      // Click handling on vineyard blocks
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        // Retrieve business-level id from feature properties
        const blockId = e.features[0].properties.id
        const blockName = e.features[0].properties.name
        const blockArea = e.features[0].properties.area_ha

        const currentBlocks = blocksRef.current
        const feature = currentBlocks?.features?.find((f: any) => f.properties.id === blockId)

        if (feature) {
          // Centroid calculations for flyTo transitions
          let sumLng = 0
          let sumLat = 0
          let count = 0
          processCoords(feature.geometry.coordinates, ([lng, lat]) => {
            sumLng += lng;
            sumLat += lat;
            count++;
          })

          const centroid: [number, number] = count > 0
            ? [sumLng / count, sumLat / count]
            : MAP_CONFIG.center as [number, number]

          const stats = await getBlockStats(blockId)
          setSelectedBlock({
            id: blockId,
            name: blockName,
            area_ha: Number(blockArea),
            geom: feature.geometry,
            stats
          })

          map.flyTo({
            center: centroid,
            zoom: 13,
            essential: true
          })
        }
      })

      // Automatic Map Fitting (fitBounds) on initial data synchronization
      if (blocks && blocks.features && blocks.features.length > 0 && !hasFittedBoundsRef.current) {
        const { bounds } = getBoundsAndCentroid(blocks)
        if (bounds) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14 })
          hasFittedBoundsRef.current = true
        }
      }
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted, blocksLoading])

  // Optimization: use source.setData() to avoid expensive map re-initializations
  useEffect(() => {
    if (mapInstance.current && blocks) {
      const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource
      if (source) {
        source.setData(blocks)

        if (blocks.features && blocks.features.length > 0 && !hasFittedBoundsRef.current) {
          const { bounds } = getBoundsAndCentroid(blocks)
          if (bounds) {
            mapInstance.current.fitBounds(bounds, { padding: 50, maxZoom: 14 })
            hasFittedBoundsRef.current = true
          }
        }
      }
    }
  }, [blocks])

  // Exposing selection test-hook on window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const currentBlocks = blocksRef.current
        const feature = currentBlocks?.features?.find((f: any) => f.properties.id === blockId)
        if (feature) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock({
            id: blockId,
            name: feature.properties.name,
            area_ha: Number(feature.properties.area_ha),
            geom: feature.geometry,
            stats
          })

          if (mapInstance.current) {
            let sumLng = 0
            let sumLat = 0
            let count = 0
            processCoords(feature.geometry.coordinates, ([lng, lat]) => {
              sumLng += lng
              sumLat += lat
              count++
            })
            if (count > 0) {
              mapInstance.current.flyTo({
                center: [sumLng / count, sumLat / count],
                zoom: 13,
                essential: true
              })
            }
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
