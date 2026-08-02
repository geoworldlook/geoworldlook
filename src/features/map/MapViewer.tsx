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
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Use refs to avoid stale closures in MapLibre event handlers
  const blocksRef = useRef<VineyardBlock[]>(blocks);
  const hoveredIdRef = useRef<string | number | null>(null);
  const getBlockStatsRef = useRef(getBlockStats);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    getBlockStatsRef.current = getBlockStats;
  }, [getBlockStats]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose window.selectBlockForTesting for automated testing / verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId);
        if (found) {
          const stats = await getBlockStatsRef.current(blockId);
          setSelectedBlock({ ...found, stats });
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
  }, []);

  // Initialize the map instance once
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
      // 1. Add GeoJSON Source
      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        generateId: true, // required for hover state tracking in feature-state
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      // 2. Add Fill Layer
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

      // 3. Add Line (Stroke) Layer
      map.addLayer({
        id: 'vineyard-stroke',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2,
          'line-opacity': 0.8
        }
      })

      // 4. Click event listener
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        // Retrieve business-level id from feature's properties
        const blockId = e.features[0].properties?.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStatsRef.current(blockId)
          setSelectedBlock({ ...blockBase, stats })

          // Fit map bounds to selected block
          const bounds = new maplibregl.LngLatBounds()
          let count = 0
          
          function processCoords(coords: any) {
            if (Array.isArray(coords) && coords.length > 0) {
              if (typeof coords[0] === 'number') {
                bounds.extend(coords as [number, number])
                count++
              } else {
                for (const item of coords) {
                  processCoords(item)
                }
              }
            }
          }

          if (blockBase.geom && blockBase.geom.coordinates) {
            processCoords(blockBase.geom.coordinates)
            if (count > 0) {
              map.fitBounds(bounds, {
                padding: 100,
                maxZoom: 15,
                duration: 1000
              })
            }
          }
        }
      })

      // 5. Hover mousemove listener
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features[0]
        const featureId = feature.id // MapLibre auto-assigned ID

        if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          )
        }

        if (featureId !== undefined) {
          hoveredIdRef.current = featureId
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: featureId },
            { hover: true }
          )
        }
      })

      // 6. Hover mouseleave listener
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
  }, [isMounted])

  // Update GeoJSON data and fitBounds automatically when blocks are loaded
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !map.isStyleLoaded() || blocks.length === 0) return

    const source = map.getSource('vineyard-blocks-data') as maplibregl.GeoJSONSource
    if (!source) return

    // Update map source without re-initializing MapLibre
    const featureCollection = {
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

    source.setData(featureCollection as any)

    // Fit map bounds to show all vineyard blocks
    const bounds = new maplibregl.LngLatBounds()
    let count = 0

    function processCoords(coords: any) {
      if (Array.isArray(coords) && coords.length > 0) {
        if (typeof coords[0] === 'number') {
          bounds.extend(coords as [number, number])
          count++
        } else {
          for (const item of coords) {
            processCoords(item)
          }
        }
      }
    }

    for (const b of blocks) {
      if (b.geom && b.geom.coordinates) {
        processCoords(b.geom.coordinates)
      }
    }

    if (count > 0) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
        duration: 1200
      })
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
