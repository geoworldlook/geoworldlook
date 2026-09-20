"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

function processCoords(coords: any[], minLngLat: [number, number], maxLngLat: [number, number]) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const [lng, lat] = coords as [number, number];
    if (lng < minLngLat[0]) minLngLat[0] = lng;
    if (lat < minLngLat[1]) minLngLat[1] = lat;
    if (lng > maxLngLat[0]) maxLngLat[0] = lng;
    if (lat > maxLngLat[1]) maxLngLat[1] = lat;
  } else {
    for (const item of coords) {
      processCoords(item, minLngLat, maxLngLat);
    }
  }
}

function computeBoundsFromBlocks(blocks: VineyardBlock[]): maplibregl.LngLatBoundsLike | null {
  if (!blocks || blocks.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const minLngLat: [number, number] = [minLng, minLat];
  const maxLngLat: [number, number] = [maxLng, maxLat];

  blocks.forEach((block) => {
    const rawGeom = block.geom;
    const geom = rawGeom?.geometry || rawGeom;
    if (geom && geom.coordinates) {
      processCoords(geom.coordinates, minLngLat, maxLngLat);
    }
  });

  if (minLngLat[0] === Infinity || maxLngLat[0] === -Infinity) return null;
  return [minLngLat, maxLngLat];
}

function computeCentroidFromGeom(geomRaw: any): [number, number] | null {
  const geom = geomRaw?.geometry || geomRaw;
  if (!geom || !geom.coordinates) return null;

  const minLngLat: [number, number] = [Infinity, Infinity];
  const maxLngLat: [number, number] = [-Infinity, -Infinity];

  processCoords(geom.coordinates, minLngLat, maxLngLat);

  if (minLngLat[0] === Infinity) return null;
  return [(minLngLat[0] + maxLngLat[0]) / 2, (minLngLat[1] + maxLngLat[1]) / 2];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();
  const blocksRef = useRef<VineyardBlock[]>([]);
  const hoveredIdRef = useRef<string | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
      const geojsonFeatures = blocksRef.current.map((b) => {
        const rawGeom = b.geom;
        const geometry = rawGeom?.geometry || rawGeom;
        return {
          type: 'Feature',
          id: b.id,
          geometry: geometry,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        };
      });

      map.addSource('vineyard-blocks-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures as any
        },
        generateId: true
      })

      // Polygon fill layer
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
      })

      // Polygon border line layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks-data',
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

      // Fit map to vineyard blocks
      const bounds = computeBoundsFromBlocks(blocksRef.current);
      if (bounds) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
      }

      // Feature hover events
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          const feat = e.features[0];
          hoveredIdRef.current = feat.id as string;
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: true }
          );
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-data', id: hoveredIdRef.current },
            { hover: false }
          );
        }
        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = '';
      });

      // Block click event
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const featProps = e.features[0].properties;
        const blockId = featProps?.id || e.features[0].id;
        const blockBase = blocksRef.current.find((b) => b.id === blockId);

        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.id);
          setSelectedBlock({ ...blockBase, timeSeries });

          const center = computeCentroidFromGeom(blockBase.geom);
          if (center) {
            map.flyTo({
              center: center,
              zoom: 14.5,
              essential: true
            });
          }
        }
      });
    });

    // Attach hook for automated testing / verification
    (window as any).selectBlockForTesting = async (blockId: string) => {
      const blockBase = blocksRef.current.find(b => b.id === blockId) || blocksRef.current[0];
      if (blockBase) {
        const timeSeries = await getBlockStats(blockBase.id);
        setSelectedBlock({ ...blockBase, timeSeries });
      }
    };

    return () => {
      delete (window as any).selectBlockForTesting;
      map.remove();
    }
  }, [isMounted]);

  // Update GeoJSON source when blocks state updates
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('vineyard-blocks-data') as maplibregl.GeoJSONSource;
    if (source) {
      const geojsonFeatures = blocks.map((b) => {
        const rawGeom = b.geom;
        const geometry = rawGeom?.geometry || rawGeom;
        return {
          type: 'Feature',
          id: b.id,
          geometry: geometry,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        };
      });

      source.setData({
        type: 'FeatureCollection',
        features: geojsonFeatures as any
      });

      const bounds = computeBoundsFromBlocks(blocks);
      if (bounds) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
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
