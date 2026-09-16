"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function processCoords(coords: any, bounds: [number, number, number, number]) {
  if (!coords) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const lng = coords[0];
    const lat = coords[1];
    bounds[0] = Math.min(bounds[0], lng);
    bounds[1] = Math.min(bounds[1], lat);
    bounds[2] = Math.max(bounds[2], lng);
    bounds[3] = Math.max(bounds[3], lat);
  } else if (Array.isArray(coords)) {
    for (const c of coords) {
      processCoords(c, bounds);
    }
  }
}

function calculateBounds(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry) return null;
  const bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];

  if (geometry.coordinates) {
    processCoords(geometry.coordinates, bounds);
  } else if (Array.isArray(geometry)) {
    processCoords(geometry, bounds);
  }

  if (bounds[0] === Infinity || bounds[2] === -Infinity) return null;
  return [[bounds[0], bounds[1]], [bounds[2], bounds[3]]];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, featureCollection, loading: blocksLoading, getVineyardStats } = useVineyardData();

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Expose test hook for frontend verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId?: string) => {
        const targetBlock = blockId
          ? blocksRef.current.find(b => b.id === blockId)
          : blocksRef.current[0];

        if (targetBlock) {
          const timeSeries = await getVineyardStats(targetBlock.id);
          setSelectedBlock({ ...targetBlock, timeSeries });

          if (mapInstance.current) {
            const bounds = calculateBounds(targetBlock.geom);
            if (bounds) {
              mapInstance.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
            }
          }
        }
      };
    }
  }, [getVineyardStats]);

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return;

    if (mapInstance.current) return; // Prevent double initialization

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
      if (!map.getSource('vineyard-blocks-data')) {
        map.addSource('vineyard-blocks-data', {
          type: 'geojson',
          data: featureCollection as any,
          generateId: true
        });

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
              0.35
            ]
          }
        });

        map.addLayer({
          id: 'vineyard-blocks-outline',
          type: 'line',
          source: 'vineyard-blocks-data',
          paint: {
            'line-color': '#34d399',
            'line-width': 2
          }
        });

        // Fit map bounds to vineyard blocks if available
        if (featureCollection.features.length > 0) {
          const overallBounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
          for (const f of featureCollection.features) {
            processCoords(f.geometry.coordinates, overallBounds);
          }
          if (overallBounds[0] !== Infinity) {
            map.fitBounds([[overallBounds[0], overallBounds[1]], [overallBounds[2], overallBounds[3]]], {
              padding: 60,
              maxZoom: 14
            });
          }
        }
      }

      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const featureProps = e.features[0].properties;
        const blockId = featureProps.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId) || {
          id: blockId,
          name: featureProps.name,
          area_ha: Number(featureProps.area_ha),
          geom: e.features[0].geometry
        };

        const timeSeries = await getVineyardStats(blockId);
        setSelectedBlock({ ...blockBase, timeSeries });

        const bounds = calculateBounds(e.features[0].geometry);
        if (bounds) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
        }
      });

      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const feature = e.features[0];
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          );
        }

        if (feature.id !== undefined) {
          hoveredIdRef.current = feature.id;
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: feature.id },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      });
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isMounted]);

  // Update source data dynamically when featureCollection changes
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded()) {
      const source = mapInstance.current.getSource('vineyard-blocks-data') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(featureCollection as any);
        if (featureCollection.features.length > 0) {
          const overallBounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
          for (const f of featureCollection.features) {
            processCoords(f.geometry.coordinates, overallBounds);
          }
          if (overallBounds[0] !== Infinity) {
            mapInstance.current.fitBounds([[overallBounds[0], overallBounds[1]], [overallBounds[2], overallBounds[3]]], {
              padding: 60,
              maxZoom: 14
            });
          }
        }
      }
    }
  }, [featureCollection]);

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
