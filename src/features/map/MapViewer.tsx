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

  const blocksRef = useRef<VineyardBlock[]>([]);
  blocksRef.current = blocks;

  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Recursive geometry coordinates extractor
  function processCoords(geom: any): [number, number][] {
    if (!geom) return [];
    if (geom.coordinates) {
      return extractCoords(geom.coordinates);
    }
    return [];
  }

  function extractCoords(coords: any): [number, number][] {
    if (!Array.isArray(coords)) return [];
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords as [number, number]];
    }
    return coords.reduce((acc: [number, number][], val: any) => {
      return acc.concat(extractCoords(val));
    }, []);
  }

  // Exposed test hook for automated verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });
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
      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocks.map(b => ({
            type: 'Feature',
            id: b.id, // required for setFeatureState hover tracking
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
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-data',
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
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Fit map bounds to contain all vineyard blocks
      const allCoords = blocks.flatMap(b => processCoords(b.geom));
      if (allCoords.length > 0) {
        const lats = allCoords.map(c => c[1]);
        const lngs = allCoords.map(c => c[0]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        
        map.fitBounds([minLng, minLat, maxLng, maxLat], {
          padding: 50,
          maxZoom: 13,
          duration: 1000
        });
      }

      // Hover Interaction handlers using Refs
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const currentId = e.features[0].id
          
          if (hoveredIdRef.current !== currentId) {
            if (hoveredIdRef.current !== null) {
              map.setFeatureState(
                { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
                { hover: false }
              )
            }
            hoveredIdRef.current = currentId ?? null
            if (hoveredIdRef.current !== null) {
              map.setFeatureState(
                { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
                { hover: true }
              )
            }
          }
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
      })

      // Click to Select and Zoom to Block
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        // MapLibre generates unique ids, get real id from properties
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });

          const blockCoords = processCoords(blockBase.geom);
          if (blockCoords.length > 0) {
            const lats = blockCoords.map(c => c[1]);
            const lngs = blockCoords.map(c => c[0]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            map.fitBounds([minLng, minLat, maxLng, maxLat], {
              padding: 80,
              maxZoom: 14,
              duration: 800
            });
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
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
