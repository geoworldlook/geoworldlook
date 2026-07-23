"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function getBounds(geojson: any) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  function processCoords(coords: any) {
    if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
      for (const coord of coords) {
        const [lng, lat] = coord;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        processCoords(item);
      }
    }
  }

  if (geojson.features) {
    for (const f of geojson.features) {
      if (f.geometry && f.geometry.coordinates) {
        processCoords(f.geometry.coordinates);
      }
    }
  } else if (geojson.geom && geojson.geom.coordinates) {
    processCoords(geojson.geom.coordinates);
  } else if (geojson.coordinates) {
    processCoords(geojson.coordinates);
  }

  if (minLng === Infinity) {
    return null;
  }
  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getVineyardStats } = useVineyardData();

  const blocksRef = useRef<VineyardBlock[]>([]);
  const hoveredIdRef = useRef<any>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 1. Initialize MapLibre
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
      // Add source for vineyard blocks
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocksRef.current.map(b => ({
            type: 'Feature',
            id: b.id, // For maplibre internal state tracking
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        },
        generateId: true // generates unique state-level IDs for feature state hover effects
      })

      // Fill Layer for vineyard blocks
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

      // Outline Layer for vineyard blocks
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
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

      // Fit map view (fitBounds) to focus on loaded vineyard blocks
      const bounds = getBounds({ features: blocksRef.current.map(b => ({ geometry: b.geom })) });
      if (bounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 });
      }

      // 2. Mouse Move Listener
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';

          const feature = e.features[0];
          const nextHoveredId = feature.id;
          
          if (hoveredIdRef.current !== nextHoveredId) {
            if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined) {
              map.setFeatureState(
                { source: 'vineyard-data', id: hoveredIdRef.current },
                { hover: false }
              );
            }

            hoveredIdRef.current = nextHoveredId;
            if (nextHoveredId !== undefined && nextHoveredId !== null) {
              map.setFeatureState(
                { source: 'vineyard-data', id: nextHoveredId },
                { hover: true }
              );
            }
          }
        }
      })

      // 3. Mouse Leave Listener
      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      // 4. Click Listener
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return

        // Retrieve business-level id from feature properties (as MapLibre might overwrite the state-level ID with generateId)
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const timeSeries = await getVineyardStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });

          const blockBounds = getBounds(blockBase);
          if (blockBounds) {
            map.fitBounds(blockBounds, { padding: 80, maxZoom: 15, duration: 1000 });
          }
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksLoading])

  // 5. Update data on data sync using source.setData() to avoid expensive map reinitialization
  useEffect(() => {
    if (!mapInstance.current || blocksLoading) return;

    const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
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
      });

      const bounds = getBounds({ features: blocks.map(b => ({ geometry: b.geom })) });
      if (bounds) {
        mapInstance.current.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 });
      }
    }
  }, [blocks, blocksLoading]);

  // Expose test-hook window.selectBlockForTesting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        if (blockBase) {
          const timeSeries = await getVineyardStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });
          if (mapInstance.current) {
            const blockBounds = getBounds(blockBase);
            if (blockBounds) {
              mapInstance.current.fitBounds(blockBounds, { padding: 80, maxZoom: 15, duration: 1000 });
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
  }, [getVineyardStats]);

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
