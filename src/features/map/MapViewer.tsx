"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyards'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Use refs to avoid stale closures in event handlers
  const blocksRef = useRef<VineyardBlock[]>(blocks)
  useEffect(() => {
    blocksRef.current = blocks
  }, [blocks])

  const hoveredIdRef = useRef<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Dynamic test hook selection handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });

          if (mapInstance.current) {
            const bounds = calculateBounds(blockBase.geom);
            if (bounds) {
              mapInstance.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
            }
          }
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    }
  }, [getBlockStats])

  // Process coordinates recursively to handle polygon geometries gracefully
  const processCoords = (geom: any): number[][] => {
    if (!geom) return [];
    if (geom.coordinates) {
      return processCoords(geom.coordinates);
    }
    if (Array.isArray(geom) && typeof geom[0] === 'number') {
      return [geom];
    }
    let flat: number[][] = [];
    for (const sub of geom) {
      flat = flat.concat(processCoords(sub));
    }
    return flat;
  };

  const calculateBounds = (geom: any): maplibregl.LngLatBoundsLike | null => {
    const coords = processCoords(geom);
    if (coords.length === 0) return null;

    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    return [[minLng, minLat], [maxLng, maxLat]];
  };

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
      // Fit bounds to target vineyard blocks region on load if available
      if (blocks.length > 0) {
        const coords = blocks.flatMap(b => processCoords(b.geom));
        if (coords.length > 0) {
          let minLng = Infinity, maxLng = -Infinity;
          let minLat = Infinity, maxLat = -Infinity;
          for (const [lng, lat] of coords) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, maxZoom: 13, animate: false });
        }
      }

      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        generateId: true, // Necessary for MapLibre feature-state based hover highlights
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
        }
      })

      // Vineyard Block Fill Layer
      map.addLayer({
        id: 'blocks-layer-fill',
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

      // Vineyard Block Outline Border Layer
      map.addLayer({
        id: 'blocks-layer-line',
        type: 'line',
        source: 'vineyard-blocks-data',
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            4,
            2
          ]
        }
      })

      // Polygon Interaction Click Handler
      map.on('click', 'blocks-layer-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)
        
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });
          
          const bounds = calculateBounds(blockBase.geom);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: 14,
              essential: true
            });
          }
        }
      })

      // Interactive Hover Highlight States
      map.on('mousemove', 'blocks-layer-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const featureId = e.features[0].id;

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }

          if (featureId !== undefined) {
            hoveredIdRef.current = featureId as string;
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: featureId },
              { hover: true }
            );
          }
        }
      })

      map.on('mouseleave', 'blocks-layer-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
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
