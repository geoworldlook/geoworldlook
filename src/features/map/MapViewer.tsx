"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

// Bounding box calculation for nested coordinate structures
function getPolygonBounds(coordinates: any): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const processCoords = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (const c of coords) {
        processCoords(c);
      }
    }
  };

  processCoords(coordinates);
  return [minLng, minLat, maxLng, maxLat];
}

// Centroid calculation for nested coordinate structures
function getCentroid(coordinates: any): [number, number] {
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  const processCoords = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      sumLng += lng;
      sumLat += lat;
      count++;
    } else {
      for (const c of coords) {
        processCoords(c);
      }
    }
  };

  processCoords(coordinates);
  return count > 0 ? [sumLng / count, sumLat / count] : [0, 0];
}

declare global {
  interface Window {
    selectBlockForTesting?: (blockId: string) => Promise<void>;
  }
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Keep latest refs for event handlers to avoid stale closures
  const blocksRef = useRef(blocks);
  const getBlockStatsRef = useRef(getBlockStats);
  const selectedBlockRef = useRef(selectedBlock);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    getBlockStatsRef.current = getBlockStats;
  }, [getBlockStats]);

  useEffect(() => {
    selectedBlockRef.current = selectedBlock;
  }, [selectedBlock]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize Map
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

    map.on('load', () => {
      // Add vineyard polygon source
      map.addSource('vineyard-source', {
        type: 'geojson',
        generateId: true, // Auto-generate numeric ID for feature state (hover)
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

      // Add fill layer for polygon styling & interaction
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

      // Add line layer for polygon boundaries
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2.5,
          'line-opacity': 0.8
        }
      })

      // Click event listener
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        
        // Use properties.id (business ID) to lookup block in current list
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStatsRef.current(blockId);
          setSelectedBlock({ ...blockBase, timeSeries: stats });
          
          const centroid = getCentroid(blockBase.geom.coordinates);
          map.flyTo({
            center: centroid,
            zoom: 13,
            essential: true
          })
        }
      })

      // Mousemove event for hover state tracking
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'

        const featId = e.features[0].id;
        if (hoveredId !== null && hoveredId !== featId) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredId },
            { hover: false }
          );
        }
        hoveredId = featId;
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredId },
            { hover: true }
          );
        }
      })

      // Mouseleave event to clean hover state
      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredId !== null) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredId },
            { hover: false }
          );
          hoveredId = null;
        }
      })

      // Perform initial bounds fitting if blocks exist on load
      if (blocks.length > 0) {
        fitMapToBounds(map, blocks);
      }
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksLoading])

  // Update source data & fit bounds when blocks change
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded() || blocks.length === 0) return;

    const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
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
      });
    }

    fitMapToBounds(map, blocks);
  }, [blocks]);

  // Helper to fit map viewport around loaded blocks
  const fitMapToBounds = (map: maplibregl.Map, blocksList: VineyardBlock[]) => {
    let globalMinLng = Infinity;
    let globalMinLat = Infinity;
    let globalMaxLng = -Infinity;
    let globalMaxLat = -Infinity;

    for (const b of blocksList) {
      if (!b.geom || !b.geom.coordinates) continue;
      const [minLng, minLat, maxLng, maxLat] = getPolygonBounds(b.geom.coordinates);
      if (minLng < globalMinLng) globalMinLng = minLng;
      if (minLat < globalMinLat) globalMinLat = minLat;
      if (maxLng > globalMaxLng) globalMaxLng = maxLng;
      if (maxLat > globalMaxLat) globalMaxLat = maxLat;
    }

    if (globalMinLng !== Infinity) {
      map.fitBounds([globalMinLng, globalMinLat, globalMaxLng, globalMaxLat], {
        padding: 60,
        maxZoom: 15,
        duration: 1200
      });
    }
  };

  // Expose automated testing hook
  useEffect(() => {
    window.selectBlockForTesting = async (blockId: string) => {
      const blockBase = blocksRef.current.find(b => b.id === blockId);
      if (blockBase) {
        const stats = await getBlockStatsRef.current(blockId);
        setSelectedBlock({ ...blockBase, timeSeries: stats });
        if (mapInstance.current) {
          const centroid = getCentroid(blockBase.geom.coordinates);
          mapInstance.current.flyTo({
            center: centroid,
            zoom: 13,
            essential: true
          });
        }
      }
    };
    return () => {
      delete window.selectBlockForTesting;
    };
  }, [blocks]);

  if (!isMounted || (blocksLoading && blocks.length === 0)) {
    return (
      <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest text-center">
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
          onClose={() => setSelectedBlock(null)} />
      )}
    </div>
  )
}
