"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Bounding box and centroid recursive calculation helper
function processCoords(coords: any, bounds: maplibregl.LngLatBounds) {
  if (Array.isArray(coords)) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      bounds.extend(coords as [number, number]);
    } else {
      for (const coord of coords) {
        processCoords(coord, bounds);
      }
    }
  }
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Keep references to access the latest state inside MapLibre event cycle listeners
  const blocksRef = useRef<VineyardBlock[]>(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Create MapLibre map instance once mounted
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
      // Add Vineyard GeoJSON source with generateId enabled for setFeatureState hover tracking
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocksRef.current.map(b => ({
            type: 'Feature',
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        },
        generateId: true
      })

      // Add solid fill polygon layer
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.4,
            0.15
          ]
        }
      })

      // Add thin outline stroke layer
      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-source',
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

      // Track hovered state internally to apply setFeatureState correctly
      let hoveredFeatureId: number | string | null = null;

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'

          const nextHoveredId = e.features[0].id;
          if (hoveredFeatureId !== null && hoveredFeatureId !== nextHoveredId) {
            map.setFeatureState(
              { source: 'vineyard-source', id: hoveredFeatureId },
              { hover: false }
            )
          }
          hoveredFeatureId = nextHoveredId as string | number;
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredFeatureId },
            { hover: true }
          )
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredFeatureId !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredFeatureId },
            { hover: false }
          )
          hoveredFeatureId = null
        }
      })

      // Click event on polygon block - retrieve original business ID from feature properties
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        const blockId = e.features[0].properties.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId);

        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });
          
          const bounds = new maplibregl.LngLatBounds();
          processCoords(blockBase.geom.coordinates, bounds);
          if (!bounds.isEmpty()) {
            map.flyTo({
              center: bounds.getCenter(),
              zoom: 14,
              essential: true
            })
          }
        }
      })

      // Automatically fit map view (fitBounds) to loaded vineyard blocks upon initial synchronization
      const bounds = new maplibregl.LngLatBounds();
      blocksRef.current.forEach(block => {
        if (block.geom?.coordinates) {
          processCoords(block.geom.coordinates, bounds);
        }
      })
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 })
      }
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksLoading])

  // Optimize and update vineyard data using source.setData() when blocks data changes dynamically
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded() || blocksLoading) return;

    const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: blocks.map(b => ({
          type: 'Feature',
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      });

      // Fit map bounds to updated blocks
      const bounds = new maplibregl.LngLatBounds();
      blocks.forEach(block => {
        if (block.geom?.coordinates) {
          processCoords(block.geom.coordinates, bounds);
        }
      })
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 1000 })
      }
    }
  }, [blocks, blocksLoading])

  // Expose test-hook window.selectBlockForTesting for visual automated UI verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const blockBase = blocksRef.current.find(b => b.id === blockId);
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });

          if (mapInstance.current) {
            const bounds = new maplibregl.LngLatBounds();
            processCoords(blockBase.geom.coordinates, bounds);
            if (!bounds.isEmpty()) {
              mapInstance.current.flyTo({
                center: bounds.getCenter(),
                zoom: 14,
                essential: true
              });
            }
          }
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
  }, [getBlockStats]);

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
