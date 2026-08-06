"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null)
  const [selectedBlockStats, setSelectedBlockStats] = useState<VineyardBlockStats[]>([])
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Refs to keep event handlers with fresh state
  const blocksRef = useRef(blocks)
  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Programmatic selection hook for frontend testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (id: string) => {
        const found = blocksRef.current.find(b => b.id === id || b.properties?.id === id)
        if (found) {
          const stats = await getBlockStats(id)
          setSelectedBlock(found)
          setSelectedBlockStats(stats)

          if (mapInstance.current) {
            // Find centroid or flyTo block
            const coords = found.geometry.coordinates
            const bounds = new maplibregl.LngLatBounds()

            const processCoords = (arr: any) => {
              if (Array.isArray(arr[0]) && typeof arr[0][0] === 'number') {
                arr.forEach((coord: any) => bounds.extend(coord as [number, number]))
              } else if (Array.isArray(arr[0])) {
                arr.forEach((sub: any) => processCoords(sub))
              }
            }
            processCoords(coords)

            if (!bounds.isEmpty()) {
              mapInstance.current.fitBounds(bounds, {
                padding: 80,
                maxZoom: 15,
                duration: 1200
              })
            }
          }
        } else {
          console.warn(`[GeoWorldLook Test] Block ${id} not found. Available blocks:`, blocksRef.current)
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting
      }
    }
  }, [blocksLoading, getBlockStats])

  useEffect(() => {
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
      // Dynamic GeoJSON Source
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks
        },
        generateId: true // Generates numerical feature IDs internally for feature-state
      })

      // Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
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

      // Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      })

      // Interactive hover states
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'

          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          
          const internalId = e.features[0].id
          if (internalId !== undefined) {
            hoveredIdRef.current = internalId
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: internalId },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })

      // Click handler to select and fit map bounds
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return

        // Retrieve business-level ID from properties because MapLibre might overwrite the top-level id
        const blockId = e.features[0].properties?.id
        const found = blocksRef.current.find(b => b.id === blockId || b.properties?.id === blockId)

        if (found) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock(found)
          setSelectedBlockStats(stats)

          // Calculate bounding box and fit bounds
          const coords = found.geometry.coordinates
          const bounds = new maplibregl.LngLatBounds()

          const processCoords = (arr: any) => {
            if (Array.isArray(arr[0]) && typeof arr[0][0] === 'number') {
              arr.forEach((coord: any) => bounds.extend(coord as [number, number]))
            } else if (Array.isArray(arr[0])) {
              arr.forEach((sub: any) => processCoords(sub))
            }
          }
          processCoords(coords)

          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: 15,
              duration: 1000
            })
          }
        }
      })
    })

    return () => {
      map.remove()
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
          stats={selectedBlockStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
