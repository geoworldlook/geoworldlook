
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardBlockWithStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockWithStats | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

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
      // 1. Add Source
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      })

      // 2. Add Fill Layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': 0.4
        }
      })

      // 3. Add Outline Layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // 4. Click Handler
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0 || !mapInstance.current) return
        const blockId = e.features[0].properties.id

        // We need to access the latest blocks state.
        // We can use a ref or just rely on the fact that this listener
        // might need to be updated, but for simplicity here we'll
        // handle it by keeping the listener stable and using the event properties.
        // However, getBlockStats and blocks are from the hook.
      })

      // 5. Hover Effects
      map.on('mouseenter', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
        map.setPaintProperty('vineyard-fill', 'fill-opacity', 0.6)
      })
      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        map.setPaintProperty('vineyard-fill', 'fill-opacity', 0.4)
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Update data when blocks change
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !map.isStyleLoaded() || blocksLoading) return

    const source = map.getSource('vineyard-blocks') as maplibregl.GeoJSONSource
    if (!source) return

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: blocks.filter(b => b.geom).map(b => ({
        type: 'Feature',
        geometry: b.geom,
        properties: {
          id: b.id,
          name: b.name,
          area_ha: b.area_ha
        }
      }))
    }

    source.setData(geojson)

    // Fit bounds to all blocks initially if they exist
    if (blocks.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      let hasGeom = false;
      blocks.forEach(b => {
        if (b.geom) {
          b.geom.coordinates[0].forEach((coord: number[]) => {
            bounds.extend(coord as [number, number]);
          });
          hasGeom = true;
        }
      });
      if (hasGeom) {
        map.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    }

    // Update click handler to use latest blocks
    map.off('click', 'vineyard-fill')
    map.on('click', 'vineyard-fill', async (e) => {
      if (!e.features || e.features.length === 0) return
      const blockId = e.features[0].properties.id
      const blockBase = blocks.find(b => b.id === blockId)

      if (blockBase) {
        const stats = await getBlockStats(blockId);
        setSelectedBlock({ ...blockBase, stats });

        const coordinates = (blockBase.geom.coordinates[0] as number[][]);
        const bounds = coordinates.reduce((acc, coord) => {
          return acc.extend(coord as [number, number]);
        }, new maplibregl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

        map.fitBounds(bounds, {
          padding: 100,
          duration: 1000
        });
      }
    })
  }, [blocks, blocksLoading, getBlockStats])

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
