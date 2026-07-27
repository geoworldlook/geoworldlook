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

  // Refs to prevent stale closures in MapLibre event listeners
  const blocksRef = useRef<any>(null)
  const hoveredIdRef = useRef<any>(null)
  const fittedRef = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  // Recursive function to extract coordinates from Polygon/MultiPolygon
  function getCoordinates(geom: any): [number, number][] {
    const coords: [number, number][] = []
    function processCoords(val: any) {
      if (Array.isArray(val)) {
        if (typeof val[0] === 'number' && typeof val[1] === 'number') {
          coords.push(val as [number, number])
        } else {
          val.forEach(processCoords)
        }
      }
    }
    if (geom && geom.coordinates) {
      processCoords(geom.coordinates)
    }
    return coords
  }

  // Calculate bounding box for fitBounds
  function getBounds(features: any[]): maplibregl.LngLatBoundsLike | null {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
    let count = 0
    features.forEach(f => {
      const coords = getCoordinates(f.geometry)
      coords.forEach(([lng, lat]) => {
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        count++
      })
    })
    if (count === 0) return null
    return [minLng, minLat, maxLng, maxLat]
  }

  // Calculate centroid for flyTo
  function getCentroid(geom: any): [number, number] {
    const coords = getCoordinates(geom)
    if (coords.length === 0) return [0, 0]
    let sumLng = 0, sumLat = 0
    coords.forEach(([lng, lat]) => {
      sumLng += lng
      sumLat += lat
    })
    return [sumLng / coords.length, sumLat / coords.length]
  }

  // Expose test hook on window
  useEffect(() => {
    (window as any).selectBlockForTesting = async (blockId: string) => {
      const currentBlocks = blocksRef.current
      if (!currentBlocks || !currentBlocks.features) return false

      const blockFeature = currentBlocks.features.find((f: any) => f.properties?.id === blockId)
      if (blockFeature) {
        const centroid = getCentroid(blockFeature.geometry)
        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: centroid,
            zoom: 13,
            essential: true
          })
        }
        const stats = await getBlockStats(blockId)
        setSelectedBlock({
          id: blockId,
          name: blockFeature.properties.name,
          area_ha: Number(blockFeature.properties.area_ha),
          geom: blockFeature.geometry,
          stats
        })
        return true
      }
      return false
    }

    return () => {
      delete (window as any).selectBlockForTesting
    }
  }, [getBlockStats])

  // Initialize MapLibre Map
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
      // Add source with generateId enabled for hover state management
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: blocksRef.current || { type: 'FeatureCollection', features: [] },
        generateId: true
      })

      // Add fill layer with dynamic hover opacity using feature-state
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
            0.3
          ]
        }
      })

      // Add line layer for borders
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Click event handler
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        const feature = e.features[0]
        const blockId = feature.properties?.id
        if (!blockId) return

        const currentBlocks = blocksRef.current
        const blockFeature = currentBlocks?.features?.find((f: any) => f.properties?.id === blockId)

        if (blockFeature) {
          const centroid = getCentroid(blockFeature.geometry)
          map.flyTo({
            center: centroid,
            zoom: 13,
            essential: true
          })

          const stats = await getBlockStats(blockId)
          setSelectedBlock({
            id: blockId,
            name: blockFeature.properties.name,
            area_ha: Number(blockFeature.properties.area_ha),
            geom: blockFeature.geometry,
            stats
          })
        }
      })

      // Hover effect on mousemove
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features[0]
        const internalId = feature.id

        if (hoveredIdRef.current !== null && hoveredIdRef.current !== internalId) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          )
        }

        hoveredIdRef.current = internalId
        map.setFeatureState(
          { source: 'vineyard-source', id: internalId },
          { hover: true }
        )
      })

      // Clear hover on mouseleave
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
  }, [isMounted])

  // Update GeoJSON source when blocks state changes
  useEffect(() => {
    if (mapInstance.current && blocks) {
      const map = mapInstance.current
      if (map.isStyleLoaded()) {
        const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource
        if (source) {
          source.setData(blocks)
        }
      } else {
        map.once('idle', () => {
          const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource
          if (source) {
            source.setData(blocks)
          }
        })
      }
    }
  }, [blocks])

  // Automatically focus on vineyard data bounds upon initial loading
  useEffect(() => {
    if (mapInstance.current && blocks && blocks.features && blocks.features.length > 0 && !fittedRef.current) {
      const bounds = getBounds(blocks.features)
      if (bounds) {
        mapInstance.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        })
        fittedRef.current = true
      }
    }
  }, [blocks])

  if (blocksLoading && (!blocks || !blocks.features || blocks.features.length === 0)) {
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
