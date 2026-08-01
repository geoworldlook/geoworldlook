"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Keep references to avoid stale closures in MapLibre event listeners
  const blocksRef = useRef<VineyardBlock[]>([]);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test hooks on window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId);
        if (found) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...found, timeSeries: stats });

          if (mapInstance.current) {
            // Find centroid or center point to center map on selection
            const center = getPolygonCenter(found.geom);
            if (center) {
              mapInstance.current.flyTo({
                center: center,
                zoom: 14,
                essential: true
              });
            }
          }
        }
      };
    }
  }, [getBlockStats]);

  // Helper to extract a single [lng, lat] coordinate from any GeoJSON Polygon geometry for centering
  function getPolygonCenter(geom: any): [number, number] | null {
    if (!geom || !geom.coordinates) return null;

    // Simple centroid/average calculation for centering
    let sumLng = 0;
    let sumLat = 0;
    let count = 0;

    const processCoords = (coords: any) => {
      if (typeof coords[0] === 'number') {
        sumLng += coords[0];
        sumLat += coords[1];
        count++;
      } else if (Array.isArray(coords)) {
        for (const child of coords) {
          processCoords(child);
        }
      }
    };

    processCoords(geom.coordinates);
    return count > 0 ? [sumLng / count, sumLat / count] : null;
  }

  // Helper to calculate Bounding Box for fitBounds on load
  function getBoundingBox(blocksList: VineyardBlock[]): [[number, number], [number, number]] | null {
    if (blocksList.length === 0) return null;

    let minLng = 180;
    let maxLng = -180;
    let minLat = 90;
    let maxLat = -90;
    let found = false;

    const processCoords = (coords: any) => {
      if (typeof coords[0] === 'number') {
        const lng = coords[0];
        const lat = coords[1];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        found = true;
      } else if (Array.isArray(coords)) {
        for (const child of coords) {
          processCoords(child);
        }
      }
    };

    for (const b of blocksList) {
      if (b.geom && b.geom.coordinates) {
        processCoords(b.geom.coordinates);
      }
    }

    if (!found) return null;
    // Add small buffer
    const buffer = 0.01;
    return [
      [minLng - buffer, minLat - buffer],
      [maxLng + buffer, maxLat + buffer]
    ];
  }

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

    let hoveredId: string | number | null = null;
    const hoveredIdRef = { current: hoveredId };

    map.on('load', () => {
      // 1. Prepare GeoJSON Feature Collection from our vineyard blocks
      const featureCollection = {
        type: 'FeatureCollection',
        features: blocks.map((b) => ({
          type: 'Feature',
          // Generate unique numeric or string ID for maplibre setFeatureState
          id: b.id,
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      };

      // 2. Add source with generateId enabled to guarantee unique feature IDs for state tracking
      map.addSource('vineyards-data', {
        type: 'geojson',
        data: featureCollection,
        generateId: true
      })

      // 3. Add polygon fill layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyards-data',
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

      // 4. Add polygon outline border layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyards-data',
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

      // 5. Setup Popups and Click handlers
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'bg-black/80 border border-white/10 text-white rounded-lg p-2 font-sans'
      });

      map.on('mousemove', 'vineyard-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'

        if (e.features && e.features.length > 0) {
          const feature = e.features[0];

          // Show tooltip popup
          const name = feature.properties?.name || 'Unknown Block';
          const area = Number(feature.properties?.area_ha || 0).toFixed(2);

          popup.setLngLat(e.lngLat)
            .setHTML(`
              <div class="text-xs p-1">
                <p class="font-bold text-emerald-400">${name}</p>
                <p class="text-gray-400 text-[10px] mt-0.5">Area: ${area} ha</p>
              </div>
            `)
            .addTo(map);

          // Update hover state
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyards-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }

          hoveredIdRef.current = feature.id ?? null;
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyards-data', id: hoveredIdRef.current },
              { hover: true }
            );
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()

        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyards-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]

        // MapLibre's generateId: true can set a local feature.id which is different.
        // We always fetch the original business ID from properties.id
        const blockId = feature.properties?.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const timeSeries = await getBlockStats(blockBase.id);
          setSelectedBlock({ ...blockBase, timeSeries });

          const center = getPolygonCenter(blockBase.geom);
          if (center) {
            map.flyTo({
              center: center,
              zoom: 14,
              essential: true
            })
          }
        }
      })

      // Auto fit map bounds to encompass all loaded vineyard blocks
      const bbox = getBoundingBox(blocks);
      if (bbox) {
        map.fitBounds(bbox, {
          padding: 50,
          maxZoom: 14,
          duration: 1000
        });
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
