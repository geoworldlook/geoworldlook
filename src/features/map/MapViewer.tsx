
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockWithStats | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || blocksLoading) return

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
      // 1. Add GeoJSON Source
      map.addSource('vineyard-blocks', {
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

      // 2. Add Polygon Layer (Fill)
      map.addLayer({
        id: 'blocks-fill',
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
      })

      // 3. Add Outline Layer
      map.addLayer({
        id: 'blocks-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // 4. Interaction: Click
      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0];
        const blockId = feature.properties.id
        const blockBase = blocks.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });

          // Fit map to polygon
          const coordinates = (blockBase.geom as any).coordinates;
          const bounds = new maplibregl.LngLatBounds();
          
          // Handle both simple Polygons and those with holes/nested arrays
          const processCoords = (coords: any) => {
            if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
              coords.forEach((c: any) => bounds.extend(c as [number, number]));
            } else {
              coords.forEach((c: any) => processCoords(c));
            }
          };
          processCoords(coordinates);

          map.fitBounds(bounds, {
            padding: 100,
            duration: 1000
          });
        }
      })

      // 5. Interaction: Hover effects
      let hoveredStateId: string | number | null = null;
      map.on('mousemove', 'blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id!;
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: true }
          );
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'blocks-fill', () => {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.getCanvas().style.cursor = '';
      });

      // Fit map to all blocks on initial load
      if (blocks.length > 0) {
        const fullBounds = new maplibregl.LngLatBounds();

        const extendBounds = (coords: any) => {
          if (Array.isArray(coords[0]) && typeof coords[0][0] === 'number') {
            coords.forEach((c: any) => fullBounds.extend(c as [number, number]));
          } else {
            coords.forEach((c: any) => extendBounds(c));
          }
        };

        blocks.forEach(b => {
          extendBounds((b.geom as any).coordinates);
        });

        if (!fullBounds.isEmpty()) {
          map.fitBounds(fullBounds, { padding: 50, duration: 0 });
        }
      }
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
