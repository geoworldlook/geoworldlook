"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardStats } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [selectedBlockStats, setSelectedBlockStats] = useState<VineyardStats[]>([])
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  const blocksRef = useRef<VineyardBlock[]>(blocks)
  const hoveredIdRef = useRef<string | number | null | undefined>(null)

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Recursive geometry coordinate extractor
  function extractCoords(geom: any): [number, number][] {
    const coords: [number, number][] = [];
    function recurse(arr: any) {
      if (!Array.isArray(arr)) return;
      if (arr.length === 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
        coords.push(arr as [number, number]);
        return;
      }
      for (const item of arr) {
        recurse(item);
      }
    }
    recurse(geom?.coordinates || geom);
    return coords;
  }

  // Calculate bounds and centroid of blocks
  function getBoundsAndCentroid(blockList: VineyardBlock[]) {
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let count = 0;

    for (const b of blockList) {
      const coords = extractCoords(b.geom);
      for (const [lng, lat] of coords) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        count++;
      }
    }

    if (count === 0) return null;

    return {
      bounds: [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]],
      centroid: [(minLng + maxLng) / 2, (minLat + maxLat) / 2] as [number, number]
    };
  }

  // Expose test hook
  useEffect(() => {
    (window as any).selectBlockForTesting = async (blockId: string) => {
      const block = blocksRef.current.find(b => b.id === blockId);
      if (block) {
        const stats = await getBlockStats(blockId);
        setSelectedBlock(block);
        setSelectedBlockStats(stats);
      }
    };
    return () => {
      delete (window as any).selectBlockForTesting;
    };
  }, [getBlockStats]);

  // Map initialization
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
      map.addSource('vineyard-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: blocksRef.current.map(b => ({
            type: 'Feature',
            id: b.id,
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

      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Click event handler using refs
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const block = blocksRef.current.find(b => b.id === blockId)
        
        if (block) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock(block);
          setSelectedBlockStats(stats);
          
          const blockBounds = getBoundsAndCentroid([block]);
          if (blockBounds) {
            map.fitBounds(blockBounds.bounds, {
              padding: 100,
              maxZoom: 15,
              essential: true
            })
          }
        }
      })

      // Hover events
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return
        const featureId = e.features[0].id

        if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined && hoveredIdRef.current !== featureId) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          )
        }

        hoveredIdRef.current = featureId
        if (featureId !== undefined) {
          map.setFeatureState(
            { source: 'vineyard-source', id: featureId },
            { hover: true }
          )
        }
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredIdRef.current !== null && hoveredIdRef.current !== undefined) {
          map.setFeatureState(
            { source: 'vineyard-source', id: hoveredIdRef.current },
            { hover: false }
          )
        }
        hoveredIdRef.current = null
        map.getCanvas().style.cursor = ''
      })

      // Initial bounds fit once loaded
      const boundsInfo = getBoundsAndCentroid(blocksRef.current);
      if (boundsInfo) {
        map.fitBounds(boundsInfo.bounds, { padding: 50, maxZoom: 14 });
      }
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Real-time source update when blocks change
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;

    const updateSource = () => {
      const source = map.getSource('vineyard-source') as maplibregl.GeoJSONSource;
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

        const boundsInfo = getBoundsAndCentroid(blocks);
        if (boundsInfo) {
          map.fitBounds(boundsInfo.bounds, { padding: 50, maxZoom: 14 });
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once('load', updateSource);
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
          timeSeries={selectedBlockStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
