"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Helper recursive function to extract all coordinates from GeoJSON geometries
function processCoords(coords: any, allLngs: number[], allLats: number[]) {
  if (Array.isArray(coords)) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      allLngs.push(coords[0]);
      allLats.push(coords[1]);
    } else {
      for (const item of coords) {
        processCoords(item, allLngs, allLats);
      }
    }
  }
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Refs to avoid stale closures in MapLibre event listeners
  const blocksRef = useRef<VineyardBlock[]>(blocks);
  const hoveredIdRef = useRef<any>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 1. Map Initialization (runs once on mount when container is ready)
  useEffect(() => {
    if (!isMounted || !mapContainer.current) return;

    console.log('🗺️ Initializing MapLibre Map...');

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    mapInstance.current = map;
    (window as any).mapInstance = map; // Expose for testing/verification

    // Expose selectBlockForTesting for seamless headless automated visual regression verification
    (window as any).selectBlockForTesting = async (blockId: string) => {
      console.log(`🧪 [TESTING] Programmatically selecting block: ${blockId}`);
      const blockBase = blocksRef.current.find(b => b.id === blockId);
      if (blockBase) {
        const timeSeries = await getBlockStats(blockId);
        setSelectedBlock({ ...blockBase, timeSeries });
        return true;
      }
      return false;
    };

    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    map.on('load', () => {
      console.log('🗺️ Map load event fired successfully!');

      // Add empty source first
      map.addSource('vineyard-data', {
        type: 'geojson',
        generateId: true,
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add fill layer for polygon styling
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

      // Add outline border
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      });

      // Listen to click events on 'vineyard-fill'
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const blockId = e.features[0].properties.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        
        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });
          
          const lLngs: number[] = [];
          const lLats: number[] = [];
          processCoords(blockBase.geom, lLngs, lLats);
          if (lLngs.length > 0) {
            const centerLng = lLngs.reduce((s, v) => s + v, 0) / lLngs.length;
            const centerLat = lLats.reduce((s, v) => s + v, 0) / lLats.length;
            map.flyTo({
              center: [centerLng, centerLat],
              zoom: 14,
              essential: true
            });
          }
        }
      });

      // Hover effects
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const fId = feature.id;

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== fId) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }

          hoveredIdRef.current = fId;
          map.setFeatureState(
            { source: 'vineyard-data', id: fId },
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

      // Mark that map is loaded and ready to accept data
      setMapLoaded(true);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isMounted]);

  // 2. Update Map Data when `blocks` or `mapLoaded` changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    console.log('🗺️ Setting vineyard data on map source...');
    const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: blocks.map((b, idx) => ({
          type: 'Feature',
          id: idx + 1, // numeric id for setFeatureState
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      });
    }
  }, [blocks, mapLoaded]);

  // 3. Fit map bounds to blocks once loaded
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || blocks.length === 0) return;

    console.log('🗺️ Fitting bounds to vineyard blocks...');
    const allLngs: number[] = [];
    const allLats: number[] = [];

    blocks.forEach(b => {
      processCoords(b.geom, allLngs, allLats);
    });

    if (allLngs.length > 0) {
      const minLng = Math.min(...allLngs);
      const maxLng = Math.max(...allLngs);
      const minLat = Math.min(...allLats);
      const maxLat = Math.max(...allLats);

      mapInstance.current.fitBounds([minLng, minLat, maxLng, maxLat], {
        padding: 50,
        maxZoom: 14,
        duration: 1500
      });
    }
  }, [blocks, mapLoaded]);

  // Show loading indicator during initialization or pending API fetch
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
          onClose={() => setSelectedBlock(null)} />
      )}
    </div>
  )
}
