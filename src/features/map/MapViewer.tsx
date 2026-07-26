"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStat } from '@/lib/mock-data/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [stats, setStats] = useState<VineyardStat[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Refs to prevent stale closures in MapLibre event handlers
  const blocksRef = useRef<VineyardBlock[]>([])
  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  // Helper function to process nested GeoJSON coordinates robustly
  function processCoords(coords: any, callback: (coord: [number, number]) => void) {
    if (Array.isArray(coords) && typeof coords[0] === 'number') {
      callback(coords as [number, number]);
    } else if (Array.isArray(coords)) {
      for (const c of coords) {
        processCoords(c, callback);
      }
    }
  }

  const handleSelectBlock = async (block: VineyardBlock) => {
    setSelectedBlock(block);
    setLoadingStats(true);
    const blockStats = await getBlockStats(block.id);
    setStats(blockStats);
    setLoadingStats(false);

    // Fit map bounds to the selected block
    if (mapInstance.current) {
      let minLng = Infinity, maxLng = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      processCoords(block.geom.coordinates, ([lng, lat]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });

      if (minLng !== Infinity) {
        mapInstance.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 80, duration: 1000 }
        );
      }
    }
  }

  // Expose test hook for visual verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const block = blocksRef.current.find(b => b.id === blockId);
        if (block) {
          await handleSelectBlock(block);
        } else {
          console.warn(`Block with ID ${blockId} not found for testing.`);
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
  }, [blocks]);

  useEffect(() => {
    // If blocks are loading and we have no cached/mock blocks, wait
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
      // Add source with generateId: true for hover state management
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: {
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
        },
        generateId: true
      })

      // Add vineyard polygon fill layer
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

      // Add vineyard polygon outline layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      })

      // Fit bounds to cover all blocks automatically on load
      let minLng = Infinity, maxLng = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      for (const b of blocks) {
        processCoords(b.geom.coordinates, ([lng, lat]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      }
      if (minLng !== Infinity) {
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 50, duration: 1000 }
        );
      }

      // Hover event listeners
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'

          const newHoveredId = e.features[0].id
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== newHoveredId) {
            map.setFeatureState(
              { source: 'vineyard-source', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          hoveredIdRef.current = newHoveredId
          if (newHoveredId !== undefined && newHoveredId !== null) {
            map.setFeatureState(
              { source: 'vineyard-source', id: newHoveredId },
              { hover: true }
            )
          }
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

      // Click event listener
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const block = blocksRef.current.find(b => b.id === blockId)
        if (block) {
          handleSelectBlock(block)
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
      
      {selectedBlock && !loadingStats && (
        <BlockPanel
          block={selectedBlock}
          stats={stats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
