"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

import { MAP_CONFIG } from './config';
import BlockPanel from './components/BlockPanel';
import { VineyardBlock } from '@/types/vineyard';
import { useVineyardData } from '@/hooks/use-vineyard-data';

interface MapViewerProps {
  points?: any[];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Refs to avoid stale closures in MapLibre event handlers
  const blocksRef = useRef<VineyardBlock[]>([]);
  const hoveredBlockIdRef = useRef<string | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    hoveredBlockIdRef.current = hoveredBlockId;
  }, [hoveredBlockId]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Expose a function on window for testing selection programmatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId);
        if (found) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...found, timeSeries: stats });

          if (mapInstance.current) {
            // Find centroid or bounding box to fly to
            const coords = found.geom.coordinates[0];
            let sumLng = 0, sumLat = 0;
            coords.forEach((coord: number[]) => {
              sumLng += coord[0];
              sumLat += coord[1];
            });
            const center: [number, number] = [sumLng / coords.length, sumLat / coords.length];
            mapInstance.current.flyTo({
              center,
              zoom: 14,
              essential: true
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

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && blocks.length === 0)) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    });

    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

    map.on('load', () => {
      const geojsonFeatures = blocks.map(b => ({
        type: 'Feature',
        id: b.id, // For generateId/feature-state tracking
        geometry: b.geom,
        properties: {
          id: b.id,
          name: b.name,
          area_ha: b.area_ha
        }
      }));

      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures
        },
        generateId: true // Required for setFeatureState to work properly
      });

      // Layer 1: Polygon Fill
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks',
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

      // Layer 2: Polygon Outline
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#34d399',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      });

      // Automatically fit map bounds to the vineyard polygons
      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.forEach(b => {
          if (b.geom && b.geom.coordinates) {
            // Support Polygon and MultiPolygon simple coordinates processing
            const processCoords = (coords: any) => {
              if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
                coords.forEach((coord: number[]) => bounds.extend(coord as [number, number]));
              } else if (Array.isArray(coords)) {
                coords.forEach(processCoords);
              }
            };
            processCoords(b.geom.coordinates);
          }
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 1000 });
        }
      }

      // Handle Interactive Clicks
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        
        // When generateId is true, business id is located in properties
        const blockId = e.features[0].properties.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId);

        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries: stats });

          // Fly to the clicked block's bounding box
          const bounds = new maplibregl.LngLatBounds();
          const processCoords = (coords: any) => {
            if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
              coords.forEach((coord: number[]) => bounds.extend(coord as [number, number]));
            } else if (Array.isArray(coords)) {
              coords.forEach(processCoords);
            }
          };
          processCoords(blockBase.geom.coordinates);
          
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 });
          }
        }
      });

      // Hover Interactive States
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        // MapLibre generates internal numerical ID or uses top level ID
        const featureId = e.features[0].id;
        const blockId = e.features[0].properties.id;

        if (hoveredBlockIdRef.current !== blockId) {
          if (hoveredBlockIdRef.current) {
            // Find old feature source-level ID if any to reset state
            const oldFeature = blocksRef.current.find(b => b.id === hoveredBlockIdRef.current);
            if (oldFeature) {
              map.setFeatureState(
                { source: 'vineyard-blocks', id: oldFeature.id },
                { hover: false }
              );
            }
          }

          setHoveredBlockId(blockId);
          map.setFeatureState(
            { source: 'vineyard-blocks', id: featureId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredBlockIdRef.current) {
          const oldFeature = blocksRef.current.find(b => b.id === hoveredBlockIdRef.current);
          if (oldFeature) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: oldFeature.id },
              { hover: false }
            );
          }
          setHoveredBlockId(null);
        }
      });
    });

    return () => {
      map.remove();
    };
  }, [isMounted, blocks, blocksLoading]);

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
    );
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
  );
}
