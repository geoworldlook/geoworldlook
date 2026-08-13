"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/hooks/use-vineyard-data'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

// Helper to recursively parse and process coordinates to calculate the bounds for fitBounds
function processCoords(geom: any): [number, number][] {
  if (!geom) return [];
  if (Array.isArray(geom)) {
    // If we've hit a pair of coordinates [lng, lat]
    if (geom.length === 2 && typeof geom[0] === 'number' && typeof geom[1] === 'number') {
      return [geom as [number, number]];
    }
    // Otherwise, recurse deeper
    return geom.reduce((acc: [number, number][], val: any) => {
      return acc.concat(processCoords(val));
    }, []);
  }
  if (geom.coordinates) {
    return processCoords(geom.coordinates);
  }
  return [];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading } = useVineyardData();

  // Keep state references updated for event listeners to avoid stale closures
  const blocksRef = useRef<VineyardBlock[]>([]);
  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test hook for automated UI verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = (id: string) => {
        const found = blocksRef.current.find(b => b.id === id);
        if (found) {
          setSelectedBlock(found);
          // If the map is loaded, fly to it
          if (mapInstance.current) {
            const coords = processCoords(found.geom);
            if (coords.length > 0) {
              const bounds = coords.reduce(
                (acc, c) => {
                  return [
                    [Math.min(acc[0][0], c[0]), Math.min(acc[0][1], c[1])],
                    [Math.max(acc[1][0], c[0]), Math.max(acc[1][1], c[1])],
                  ];
                },
                [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]] as [[number, number], [number, number]]
              );
              mapInstance.current.fitBounds(bounds, { padding: 80, duration: 1500 });
            }
          }
        }
      };
    }
  }, []);

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
      // Prepare FeatureCollection with unique IDs and properties for polygons
      const geojsonFeatures = blocks.map((b, index) => {
        const numericId = index + 1; // MapLibre setFeatureState requires a numeric/string feature ID
        return {
          type: 'Feature',
          id: numericId, // Top-level ID used by MapLibre state machine
          geometry: b.geom,
          properties: {
            id: b.id, // Business UUID
            name: b.name,
            area_ha: b.area_ha,
            numericId
          }
        };
      });

      const sourceData: any = {
        type: 'FeatureCollection',
        features: geojsonFeatures
      };

      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: sourceData,
        generateId: true // Instructs MapLibre to assign numeric IDs for hover interactions
      })

      // Polygon fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
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

      // Polygon boundary stroke layer
      map.addLayer({
        id: 'vineyard-blocks-stroke',
        type: 'line',
        source: 'vineyard-blocks-source',
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

      // Hover states handling using feature-state
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const feature = e.features[0];
        const newHoverId = feature.id;

        if (newHoverId !== undefined && newHoverId !== null) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== newHoverId) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          hoveredIdRef.current = newHoverId;
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: newHoverId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      });

      // Handle polygon click interaction
      map.on('click', 'vineyard-blocks-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        // Retrieve business-level UUID from properties
        const blockId = e.features[0].properties.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId);

        if (blockBase) {
          setSelectedBlock(blockBase);

          // Fly map and zoom automatically fitting the bounding box of polygon
          const coords = processCoords(blockBase.geom);
          if (coords.length > 0) {
            const bounds = coords.reduce(
              (acc, c) => {
                return [
                  [Math.min(acc[0][0], c[0]), Math.min(acc[0][1], c[1])],
                  [Math.max(acc[1][0], c[0]), Math.max(acc[1][1], c[1])],
                ];
              },
              [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]] as [[number, number], [number, number]]
            );

            map.fitBounds(bounds, {
              padding: 80,
              duration: 1500,
              essential: true
            });
          }
        }
      });

      // Fit map to show all polygon layers initially if they exist
      if (blocks.length > 0) {
        const allCoords = blocks.flatMap(b => processCoords(b.geom));
        if (allCoords.length > 0) {
          const bounds = allCoords.reduce(
            (acc, c) => {
              return [
                [Math.min(acc[0][0], c[0]), Math.min(acc[0][1], c[1])],
                [Math.max(acc[1][0], c[0]), Math.max(acc[1][1], c[1])],
              ];
            },
            [[allCoords[0][0], allCoords[0][1]], [allCoords[0][0], allCoords[0][1]]] as [[number, number], [number, number]]
          );

          map.fitBounds(bounds, {
            padding: 50,
            duration: 1000
          });
        }
      }
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
