"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { useVineyardData, VineyardStat } from '@/hooks/use-vineyard-data'

interface SelectedBlock {
  id: string;
  name: string;
  area_ha: number;
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<SelectedBlock | null>(null)
  const [selectedStats, setSelectedStats] = useState<VineyardStat[]>([])
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Keep references to blocks and hovered item ID to avoid stale closure issues in MapLibre event cycle
  const blocksRef = useRef(blocks);
  const hoveredIdRef = useRef<any>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Recursive coordinate processor to handle nested GeoJSON coordinates robustly
  function processCoords(coords: any, callback: (coord: [number, number]) => void) {
    if (Array.isArray(coords)) {
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        callback(coords as [number, number]);
      } else {
        for (const item of coords) {
          processCoords(item, callback);
        }
      }
    }
  }

  // Calculate bounding box for fitBounds
  function getBlocksBounds(blockList: any[]): maplibregl.LngLatBoundsLike | null {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let count = 0;

    for (const block of blockList) {
      if (block.geometry && block.geometry.coordinates) {
        processCoords(block.geometry.coordinates, (coord) => {
          const [lng, lat] = coord;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          count++;
        });
      }
    }

    if (count === 0) return null;
    return [[minLng, minLat], [maxLng, maxLat]];
  }

  // Calculate centroid for flyTo
  function getCentroid(coordinates: any): [number, number] | null {
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;

    processCoords(coordinates, (coord) => {
      sumLng += coord[0];
      sumLat += coord[1];
      count++;
    });

    if (count === 0) return null;
    return [sumLng / count, sumLat / count];
  }

  // 1. Map initialization
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
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocksRef.current
        },
        generateId: true
      })

      // Polygon fill layer for hover and click events
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

      // Polygon border line layer
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Mouse move event - manage hover state
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const featureId = e.features[0].id;
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          );
        }
        hoveredIdRef.current = featureId;
        map.setFeatureState(
          { source: 'vineyard-source', id: featureId },
          { hover: true }
        );
      })

      // Mouse leave event
      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      // Click event - retrieve business id from properties to handle interactive BlockPanel
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const properties = e.features[0].properties;
        if (!properties) return;

        const businessId = properties.id;
        const blockItem = blocksRef.current.find(b => {
          const bId = b.properties?.id || b.id;
          return bId === businessId;
        });

        if (blockItem) {
          const stats = await getBlockStats(businessId);
          setSelectedBlock({
            id: businessId,
            name: blockItem.properties?.name || 'Unknown Block',
            area_ha: Number(blockItem.properties?.area_ha || 0)
          });
          setSelectedStats(stats);

          const centroid = getCentroid(blockItem.geometry?.coordinates);
          if (centroid) {
            map.flyTo({
              center: centroid,
              zoom: 13,
              essential: true
            });
          }
        }
      })

      // Auto fit bounds to blocks upon map loading
      const bounds = getBlocksBounds(blocksRef.current);
      if (bounds) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 14, animate: false });
      }
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted, blocksLoading])

  // 2. Efficiently update map data using source.setData() to avoid complete map re-creation
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    if (map.isStyleLoaded()) {
      const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: blocks
        });

        const bounds = getBlocksBounds(blocks);
        if (bounds) {
          map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        }
      }
    }
  }, [blocks]);

  // 3. Expose test-hook window.selectBlockForTesting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockItem = blocksRef.current.find(b => {
          const bId = b.properties?.id || b.id;
          return bId === blockId;
        });

        if (blockItem) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({
            id: blockId,
            name: blockItem.properties?.name || 'Unknown Block',
            area_ha: Number(blockItem.properties?.area_ha || 0)
          });
          setSelectedStats(stats);

          if (mapInstance.current) {
            const centroid = getCentroid(blockItem.geometry?.coordinates);
            if (centroid) {
              mapInstance.current.flyTo({
                center: centroid,
                zoom: 13,
                essential: true
              });
            }
          }
        } else {
          console.warn(`[MapViewer] Test-hook: Block with id "${blockId}" not found.`);
        }
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
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
          stats={selectedStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
