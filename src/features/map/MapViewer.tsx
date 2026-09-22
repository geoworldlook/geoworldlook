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

function getPolygonBounds(coordinates: number[][][]): [[number, number], [number, number]] | null {
  if (!coordinates || coordinates.length === 0 || !coordinates[0]) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  for (const ring of coordinates) {
    for (const point of ring) {
      if (Array.isArray(point) && point.length >= 2) {
        const [lng, lat] = point;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  if (minLng === Infinity || minLat === Infinity) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocks.find(b => b.id === blockId) || blocks[0];
        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.id);
          setSelectedBlock({ ...blockBase, timeSeries });
        }
      };
    }
  }, [blocks, getBlockStats]);

  useEffect(() => {
    if (!isMounted || !mapContainer.current || blocksLoading) return

    // Calculate initial center based on blocks if available
    let initialCenter = MAP_CONFIG.center;
    if (blocks.length > 0 && blocks[0].geom?.coordinates?.[0]?.[0]) {
      const firstPoint = blocks[0].geom.coordinates[0][0];
      initialCenter = [firstPoint[0], firstPoint[1]];
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: initialCenter,
      zoom: 13.5,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    })

    mapInstance.current = map
    map.addControl(new maplibregl.NavigationControl(), 'bottom-left')

    map.on('load', () => {
      // 1. Add GeoJSON source for vineyard polygon blocks
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: {
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
        }
      })

      // 2. Add Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-fill-layer',
        type: 'fill',
        source: 'vineyard-blocks-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.35
        }
      })

      // 3. Add Polygon Border / Outline Layer
      map.addLayer({
        id: 'vineyard-border-layer',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#34d399',
          'line-width': 2.5,
          'line-opacity': 0.9
        }
      })

      // Automatically fit map view to bounding box of all vineyard blocks
      if (blocks.length > 0) {
        let allLngs: number[] = [];
        let allLats: number[] = [];

        blocks.forEach(b => {
          if (b.geom?.coordinates) {
            b.geom.coordinates.forEach(ring => {
              ring.forEach(pt => {
                if (Array.isArray(pt) && pt.length >= 2) {
                  allLngs.push(pt[0]);
                  allLats.push(pt[1]);
                }
              });
            });
          }
        });

        if (allLngs.length > 0 && allLats.length > 0) {
          const minLng = Math.min(...allLngs);
          const maxLng = Math.max(...allLngs);
          const minLat = Math.min(...allLats);
          const maxLat = Math.max(...allLats);

          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 60,
            maxZoom: 15
          });
        }
      }

      // Click event listener on polygon fill layer
      map.on('click', 'vineyard-fill-layer', async (e) => {
        if (!e.features || e.features.length === 0) return;
        const blockId = e.features[0].properties?.id;
        const blockBase = blocks.find(b => b.id === blockId);

        if (blockBase) {
          const timeSeries = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries });

          const bounds = getPolygonBounds(blockBase.geom?.coordinates);
          if (bounds) {
            map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 1000 });
          }
        }
      });

      // Cursor hover styles
      map.on('mouseenter', 'vineyard-fill-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
        map.setPaintProperty('vineyard-fill-layer', 'fill-opacity', 0.55);
      });

      map.on('mouseleave', 'vineyard-fill-layer', () => {
        map.getCanvas().style.cursor = '';
        map.setPaintProperty('vineyard-fill-layer', 'fill-opacity', 0.35);
      });
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  if (!isMounted || blocksLoading) {
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
