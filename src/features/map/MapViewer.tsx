"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStat } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [blockStats, setBlockStats] = useState<VineyardStat[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Refs for map libre event handlers to avoid stale closures
  const blocksRef = useRef<VineyardBlock[]>([]);
  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Helper functions for bounds calculations
  function getBoundsForCoords(coords: any) {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

    function processCoords(c: any) {
      if (!c) return;
      if (c.coordinates) {
        processCoords(c.coordinates);
      } else if (Array.isArray(c) && typeof c[0] === 'number') {
        const [lng, lat] = c;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(c)) {
        c.forEach(processCoords);
      }
    }

    processCoords(coords);
    if (minLng === Infinity) return null;
    return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
  }

  function getBoundsForBlocks(blocksList: VineyardBlock[]) {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

    function processCoords(c: any) {
      if (!c) return;
      if (c.coordinates) {
        processCoords(c.coordinates);
      } else if (Array.isArray(c) && typeof c[0] === 'number') {
        const [lng, lat] = c;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(c)) {
        c.forEach(processCoords);
      }
    }

    blocksList.forEach(b => processCoords(b.geom));
    if (minLng === Infinity) return null;
    return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
  }

  // Effect 1: Initialize the MapLibre map on mount
  useEffect(() => {
    if (!isMounted || !mapContainer.current) return;

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
      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapInstance.current = null
      setMapLoaded(false)
    }
  }, [isMounted])

  // Effect 2: Manage GeoJSON source, layers, hover states, and bounds fitting
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    const geoJsonData: any = {
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
    };

    const existingSource = map.getSource('vineyard-data') as maplibregl.GeoJSONSource;
    if (existingSource) {
      // Optimize by updating data instead of reinitializing
      existingSource.setData(geoJsonData);
    } else {
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: geoJsonData,
        generateId: true // Required for feature-state hover support
      });

      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.5,
            0.2
          ]
        }
      });

      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      });

      // Setup interactive mouse and click event listeners
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        map.getCanvas().style.cursor = 'pointer';

        const newHoveredFeature = e.features[0];
        if (newHoveredFeature && newHoveredFeature.id !== undefined) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== newHoveredFeature.id) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          hoveredIdRef.current = newHoveredFeature.id;
          map.setFeatureState(
            { source: 'vineyard-data', id: newHoveredFeature.id },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      });

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;

        // Retrieve business-level id from feature's properties object
        const blockId = e.features[0].properties?.id;
        const foundBlock = blocksRef.current.find(b => b.id === blockId);

        if (foundBlock) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock(foundBlock);
          setBlockStats(stats);

          const bounds = getBoundsForCoords(foundBlock.geom);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 50,
              duration: 1000
            });
          }
        }
      });
    }

    // Auto fit bounds on initial load of blocks (Zielona Góra approx [15.5, 51.9])
    if (blocks.length > 0) {
      const overallBounds = getBoundsForBlocks(blocks);
      if (overallBounds) {
        map.fitBounds(overallBounds, {
          padding: 50,
          duration: 1000
        });
      }
    }
  }, [mapLoaded, blocks]);

  // Expose a test-hook on window.selectBlockForTesting for automated testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const foundBlock = blocksRef.current.find(b => b.id === blockId);
        if (foundBlock) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock(foundBlock);
          setBlockStats(stats);

          const bounds = getBoundsForCoords(foundBlock.geom);
          if (bounds) {
            mapInstance.current?.fitBounds(bounds, {
              padding: 50,
              duration: 1000
            });
          }
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
  }, [getBlockStats]);

  // Handle loading and initial transition state
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
          stats={blockStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
