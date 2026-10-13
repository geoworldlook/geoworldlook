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

// Helper to calculate Bounding Box from standard GeoJSON geometry
function computeBounds(geometry: any): maplibregl.LngLatBoundsLike | null {
  if (!geometry) return null;
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        processCoords(item);
      }
    }
  }

  if (geometry.coordinates) {
    processCoords(geometry.coordinates);
  } else if (geometry.type === 'FeatureCollection' && geometry.features) {
    for (const f of geometry.features) {
      if (f.geometry) processCoords(f.geometry.coordinates);
    }
  }

  if (minLng === Infinity || minLat === Infinity) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const hoveredIdRef = useRef<string | number | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();
  const blocksRef = useRef<VineyardBlock[]>(blocks);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && blocks.length === 0)) return

    const initialMap = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    })

    mapInstance.current = initialMap
    initialMap.addControl(new maplibregl.NavigationControl(), 'bottom-left')

    initialMap.on('load', () => {
      const geojsonFeatureCollection = {
        type: 'FeatureCollection',
        features: blocks
      }

      initialMap.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: geojsonFeatureCollection as any,
        generateId: true
      })

      initialMap.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
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

      initialMap.addLayer({
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#34d399',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      })

      // Auto-fit map to polygons bounding box
      const bounds = computeBounds({ type: 'FeatureCollection', features: blocks });
      if (bounds) {
        initialMap.fitBounds(bounds, { padding: 60, maxZoom: 15 });
      }

      // Hover interactivity
      initialMap.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          initialMap.getCanvas().style.cursor = 'pointer'
          const feature = e.features[0]
          
          if (hoveredIdRef.current !== null) {
            initialMap.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          hoveredIdRef.current = feature.id ?? null;
          if (hoveredIdRef.current !== null) {
            initialMap.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: true }
            )
          }
        }
      })

      initialMap.on('mouseleave', 'vineyard-blocks-fill', () => {
        initialMap.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          initialMap.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })

      // Selection handling
      initialMap.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const clickedPropId = e.features[0].properties?.id
        const currentBlocks = blocksRef.current
        const blockBase = currentBlocks.find(b => b.properties.id === clickedPropId || b.id === clickedPropId) || currentBlocks[0]

        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.properties.id);
          setSelectedBlock({ ...blockBase, timeSeries });

          const blockBounds = computeBounds(blockBase.geometry);
          if (blockBounds) {
            initialMap.fitBounds(blockBounds, { padding: 100, maxZoom: 16, duration: 1000 });
          }
        }
      })
    })

    // Expose test helper for automated testing or verification
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId?: string) => {
        const targetBlock = blocksRef.current.find(b => b.properties.id === blockId) || blocksRef.current[0];
        if (targetBlock) {
          const timeSeries = await getBlockStats(targetBlock.properties.id);
          setSelectedBlock({ ...targetBlock, timeSeries });
          const blockBounds = computeBounds(targetBlock.geometry);
          if (blockBounds && mapInstance.current) {
            mapInstance.current.fitBounds(blockBounds, { padding: 100, maxZoom: 16, duration: 800 });
          }
        }
      };
    }

    return () => {
      initialMap.remove()
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    }
  }, [isMounted, blocks, blocksLoading])

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
