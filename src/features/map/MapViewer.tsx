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

  // Use refs to store the latest values for event handlers to prevent stale closures
  const blocksRef = useRef<VineyardBlock[]>([]);
  blocksRef.current = blocks;

  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test hook for visual and automated verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId);
        if (found) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...found, stats });
        }
      };
    }
  }, [getBlockStats]);

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
      // 1. Build FeatureCollection from the polygons
      const geojsonFeatures = blocks.map(b => ({
        type: 'Feature',
        id: b.id, // Set top-level string/number ID
        geometry: b.geom,
        properties: {
          id: b.id, // Also set inside properties as MapLibre generateId: true can overwrite top-level id
          name: b.name,
          area_ha: b.area_ha
        }
      }));

      map.addSource('vineyards-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures as any
        },
        generateId: true // Instructs MapLibre to generate unique numerical IDs for feature-state
      })

      // 2. Add Polygon Fill Layer with interactive feature-state styling
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyards-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.25
          ]
        }
      })

      // 3. Add Polygon Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyards-data',
        paint: {
          'line-color': '#34d399',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ]
        }
      })

      // Fit map bounds to the vineyard polygon boundaries recursively
      try {
        const coords: number[][] = [];
        const processCoords = (arr: any) => {
          if (Array.isArray(arr) && typeof arr[0] === 'number') {
            coords.push(arr);
          } else if (Array.isArray(arr)) {
            arr.forEach(item => processCoords(item));
          }
        };

        blocks.forEach(b => {
          if (b.geom && b.geom.coordinates) {
            processCoords(b.geom.coordinates);
          }
        });

        if (coords.length > 0) {
          const bounds = coords.reduce((acc, coord) => {
            return [
              [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
              [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
            ];
          }, [[coords[0][0], coords[0][1]], [coords[0][0], coords[0][1]]]);

          map.fitBounds(bounds as any, {
            padding: 50,
            maxZoom: 14,
            duration: 1500
          });
        }
      } catch (err) {
        console.error('Error fitting bounds:', err);
      }

      // 4. Click event to select block and load stats
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        // Retrieve custom properties id because generateId may override top level id
        const blockId = e.features[0].properties?.id
        if (!blockId) return;

        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });
          
          // Calculate centroid of the polygon to flyTo
          try {
            const polygonCoords: number[][] = [];
            const collect = (arr: any) => {
              if (Array.isArray(arr) && typeof arr[0] === 'number') {
                polygonCoords.push(arr);
              } else if (Array.isArray(arr)) {
                arr.forEach(i => collect(i));
              }
            };
            collect(blockBase.geom.coordinates);

            if (polygonCoords.length > 0) {
              const sumLng = polygonCoords.reduce((sum, c) => sum + c[0], 0);
              const sumLat = polygonCoords.reduce((sum, c) => sum + c[1], 0);
              const centroid = [sumLng / polygonCoords.length, sumLat / polygonCoords.length] as [number, number];

              map.flyTo({
                center: centroid,
                zoom: 12,
                essential: true
              })
            }
          } catch (err) {
            console.error('Error flying to centroid:', err);
          }
        }
      })

      // 5. Manage hover states utilizing feature-state and generateId
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return;

        map.getCanvas().style.cursor = 'pointer'

        const currentFeatureId = e.features[0].id;
        if (currentFeatureId !== undefined && currentFeatureId !== null) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== currentFeatureId) {
            map.setFeatureState(
              { source: 'vineyards-data', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          hoveredIdRef.current = currentFeatureId;
          map.setFeatureState(
            { source: 'vineyards-data', id: currentFeatureId },
            { hover: true }
          );
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyards-data', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [isMounted, blocks, blocksLoading])

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
