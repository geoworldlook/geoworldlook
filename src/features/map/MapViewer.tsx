"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function getBlocksBounds(blocksList: VineyardBlock[]): maplibregl.LngLatBoundsLike | null {
  if (blocksList.length === 0) return null;
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let hasCoords = false;

  const processCoords = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      hasCoords = true;
    } else if (Array.isArray(coords)) {
      coords.forEach(processCoords);
    }
  };

  blocksList.forEach(b => {
    if (b.geom && b.geom.coordinates) {
      processCoords(b.geom.coordinates);
    }
  });

  if (!hasCoords) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getVineyardStats } = useVineyardData();

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const getVineyardStatsRef = useRef(getVineyardStats);
  useEffect(() => {
    getVineyardStatsRef.current = getVineyardStats;
  }, [getVineyardStats]);

  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose the selectBlockForTesting function on the window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        if (blockBase) {
          const stats = await getVineyardStatsRef.current(blockId);
          setSelectedBlock({ ...blockBase, timeSeries: stats });
          if (mapInstance.current) {
            const bounds = getBlocksBounds([blockBase]);
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
    };
  }, []);

  // Initialize MapLibre
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
      // Add source for vineyard blocks
      map.addSource('vineyard-source', {
        type: 'geojson',
        generateId: true,
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      // Layer 1: Vineyard polygon fill with hover state
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

      // Layer 2: Vineyard outline
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Click event for selecting blocks
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getVineyardStatsRef.current(blockId);
          setSelectedBlock({ ...blockBase, timeSeries: stats });
          
          const bounds = getBlocksBounds([blockBase]);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 80,
              maxZoom: 14,
              duration: 1000
            })
          }
        }
      })

      // Hover and cursor events
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const featureId = e.features[0].id

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-source', id: hoveredIdRef.current },
              { hover: false }
            );
          }

          hoveredIdRef.current = featureId ?? null;
          if (featureId !== undefined) {
            map.setFeatureState(
              { source: 'vineyard-source', id: featureId },
              { hover: true }
            );
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      setIsMapLoaded(true)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    };
  }, [isMounted])

  // Update GeoJSON source with blocks data when loaded
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current) return;

    const source = mapInstance.current.getSource('vineyard-source') as maplibregl.GeoJSONSource;
    if (source) {
      const geojson: any = {
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
      };

      source.setData(geojson);

      // Fit map to bounds of all blocks
      const bounds = getBlocksBounds(blocks);
      if (bounds) {
        mapInstance.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        });
      }
    }
  }, [isMapLoaded, blocks]);

  // Handle loading state
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
