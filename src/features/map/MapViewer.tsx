
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockWithStats } from '@/types/vineyards'
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
    if (!isMounted || !mapContainer.current || (blocksLoading && !blocks)) return

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
      if (!blocks) return;

      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: blocks,
        generateId: true
      })

      // Fill layer for polygons
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks',
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

      // Outline layer for polygons
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      let hoveredId: string | number | null = null;

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredId },
              { hover: false }
            );
          }
          hoveredId = e.features[0].id!;
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredId },
            { hover: true }
          );
          map.getCanvas().style.cursor = 'pointer';
        }
      });

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredId },
            { hover: false }
          );
        }
        hoveredId = null;
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties.id
        
        // Find block in our local data
        const blockData = blocks.features.find((f: any) => f.properties.id === blockId)

        if (blockData) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({
            id: blockData.properties.id,
            name: blockData.properties.name,
            area_ha: blockData.properties.area_ha,
            geom: blockData.geometry,
            stats
          });

          // Calculate center of polygon for flyTo
          if (blockData.geometry.type === 'Polygon') {
            const coords = blockData.geometry.coordinates[0];
            const lngSum = coords.reduce((acc: number, c: any) => acc + c[0], 0);
            const latSum = coords.reduce((acc: number, c: any) => acc + c[1], 0);
            const center = [lngSum / coords.length, latSum / coords.length] as [number, number];

            map.flyTo({
              center: center,
              zoom: 14,
              essential: true
            })
          }
        }
      })

      // Zoom to fit all blocks
      if (blocks.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.features.forEach((f: any) => {
          if (f.geometry.type === 'Polygon') {
            f.geometry.coordinates[0].forEach((c: any) => {
              bounds.extend(c as [number, number]);
            });
          }
        });
        map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  if (!isMounted || (blocksLoading && !blocks)) {
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
