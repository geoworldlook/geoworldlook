"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

/**
 * Helper function to recursively extract all coordinates from GeoJSON Geometry objects.
 */
function processCoords(geometry: any, coords: [number, number][] = []): [number, number][] {
  if (!geometry) return coords;
  if (geometry.coordinates) {
    processCoords(geometry.coordinates, coords);
  } else if (Array.isArray(geometry)) {
    if (geometry.length === 2 && typeof geometry[0] === 'number' && typeof geometry[1] === 'number') {
      coords.push(geometry as [number, number]);
    } else {
      for (const child of geometry) {
        processCoords(child, coords);
      }
    }
  }
  return coords;
}

/**
 * Calculates bounding box [minLng, minLat, maxLng, maxLat] from GeoJSON feature or geometry.
 */
function getGeoJSONBounds(geom: any): [number, number, number, number] | null {
  const coords = processCoords(geom);
  if (coords.length === 0) return null;

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < maxLat) maxLat = lat; // wait, check bounds calculation
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)

  const { blocks, loading: blocksLoading, getVineyardStats } = useVineyardData();

  const blocksRef = useRef<VineyardBlock[]>(blocks);
  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Expose testing hook on window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (identifier?: string) => {
        const targetBlock = identifier
          ? blocksRef.current.find(b => b.id === identifier || b.name.includes(identifier))
          : blocksRef.current[0];

        if (targetBlock) {
          const stats = await getVineyardStats(targetBlock.id);
          setSelectedBlock({ ...targetBlock, timeSeries: stats });
          return targetBlock;
        }
        return null;
      };
    }
  }, [getVineyardStats]);

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return;
    if (blocksLoading && blocks.length === 0) return;

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
      const geojsonData = {
        type: 'FeatureCollection',
        features: blocks.map((b, idx) => ({
          type: 'Feature',
          id: b.id || idx + 1,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      };

      if (!map.getSource('vineyard-data')) {
        map.addSource('vineyard-data', {
          type: 'geojson',
          data: geojsonData as any,
          generateId: true
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
              0.25
            ]
          }
        });

        map.addLayer({
          id: 'vineyard-line',
          type: 'line',
          source: 'vineyard-data',
          paint: {
            'line-color': '#10b981',
            'line-width': 2
          }
        });

        // Fit bounds if we have blocks
        if (blocks.length > 0) {
          const allCoords: [number, number][] = [];
          blocks.forEach(b => processCoords(b.geom, allCoords));
          if (allCoords.length > 0) {
            let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
            for (const [lng, lat] of allCoords) {
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
            }
            map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, maxZoom: 14 });
          }
        }
      }

      // Hover effect
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          if (feature.id !== undefined && feature.id !== null) {
            if (hoveredIdRef.current !== null && hoveredIdRef.current !== feature.id) {
              map.setFeatureState(
                { source: 'vineyard-data', id: hoveredIdRef.current },
                { hover: false }
              );
            }
            hoveredIdRef.current = feature.id;
            map.setFeatureState(
              { source: 'vineyard-data', id: feature.id },
              { hover: true }
            );
          }
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

      // Click listener
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const featureProps = e.features[0].properties;
        const blockId = featureProps.id;
        const targetBlock = blocksRef.current.find(b => b.id === blockId);

        if (targetBlock) {
          const timeSeries = await getVineyardStats(blockId);
          setSelectedBlock({ ...targetBlock, timeSeries });

          const bounds = getGeoJSONBounds(targetBlock.geom);
          if (bounds) {
            map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
              padding: 60,
              maxZoom: 15,
              duration: 1000
            });
          }
        }
      });
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [isMounted, blocksLoading]);

  // Update GeoJSON source when blocks change dynamically
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded() && mapInstance.current.getSource('vineyard-data')) {
      const source = mapInstance.current.getSource('vineyard-data') as maplibregl.GeoJSONSource;
      const geojsonData = {
        type: 'FeatureCollection',
        features: blocks.map((b, idx) => ({
          type: 'Feature',
          id: b.id || idx + 1,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      };
      source.setData(geojsonData as any);

      if (blocks.length > 0) {
        const allCoords: [number, number][] = [];
        blocks.forEach(b => processCoords(b.geom, allCoords));
        if (allCoords.length > 0) {
          let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
          for (const [lng, lat] of allCoords) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
          mapInstance.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 50, maxZoom: 14 });
        }
      }
    }
  }, [blocks]);

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
