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
  const blocksRef = useRef<VineyardBlock[]>(blocks)
  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Recursive extraction of coordinates for bounds calculation
  function processCoords(geom: any): [number, number][] {
    if (!geom) return []
    let coords: [number, number][] = []
    if (geom.type === 'FeatureCollection') {
      for (const f of geom.features) {
        coords = coords.concat(processCoords(f))
      }
    } else if (geom.type === 'Feature') {
      coords = coords.concat(processCoords(geom.geometry))
    } else if (geom.coordinates) {
      const flatten = (arr: any) => {
        if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
          coords.push([arr[0], arr[1]])
        } else if (Array.isArray(arr)) {
          for (const item of arr) flatten(item)
        }
      }
      flatten(geom.coordinates)
    }
    return coords
  }

  function getBounds(geom: any): maplibregl.LngLatBoundsLike | null {
    const coords = processCoords(geom)
    if (coords.length === 0) return null
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    return [[minLng, minLat], [maxLng, maxLat]]
  }

  const handleSelectBlock = async (block: VineyardBlock) => {
    const timeSeries = await getBlockStats(block.id)
    setSelectedBlock({ ...block, timeSeries })

    if (mapInstance.current && block.geom) {
      const bounds = getBounds(block.geom)
      if (bounds) {
        mapInstance.current.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1000 })
      }
    }
  }

  // Window test hook for automated verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId) || blocksRef.current[0]
        if (found) {
          await handleSelectBlock(found)
        }
      }
    }
  }, [getBlockStats])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return
    if (blocksLoading && blocks.length === 0) return

    if (!mapInstance.current) {
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
          features: blocksRef.current.map(b => ({
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

        map.addSource('vineyard-blocks-source', {
          type: 'geojson',
          data: featureCollection as any,
          generateId: true
        })

        // Fill layer
        map.addLayer({
          id: 'vineyard-blocks-fill',
          type: 'fill',
          source: 'vineyard-blocks-source',
          paint: {
            'fill-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#10b981',
              '#059669'
            ],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.6,
              0.35
            ]
          }
        })

        // Outline layer
        map.addLayer({
          id: 'vineyard-blocks-outline',
          type: 'line',
          source: 'vineyard-blocks-source',
          paint: {
            'line-color': '#34d399',
            'line-width': 2
          }
        })

        // Fit map to all blocks on load
        const allBounds = getBounds({ type: 'FeatureCollection', features: featureCollection.features })
        if (allBounds) {
          map.fitBounds(allBounds, { padding: 50, maxZoom: 15, duration: 1000 })
        }

        // Click event
        map.on('click', 'vineyard-blocks-fill', async (e) => {
          if (!e.features || e.features.length === 0) return
          const feature = e.features[0]
          const blockId = feature.properties?.id || feature.id
          const block = blocksRef.current.find(b => b.id === blockId)

          if (block) {
            await handleSelectBlock(block)
          }
        })

        // Hover events
        map.on('mousemove', 'vineyard-blocks-fill', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          if (e.features && e.features.length > 0) {
            if (hoveredIdRef.current !== null) {
              map.setFeatureState(
                { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
                { hover: false }
              )
            }
            hoveredIdRef.current = e.features[0].id ?? null
            if (hoveredIdRef.current !== null) {
              map.setFeatureState(
                { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
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
    } else {
      // Update source data if map already exists
      const source = mapInstance.current.getSource('vineyard-blocks-source') as maplibregl.GeoJSONSource
      if (source) {
        const featureCollection = {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
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
        source.setData(featureCollection as any)
      }
    }
  }, [isMounted, blocks, blocksLoading])

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
