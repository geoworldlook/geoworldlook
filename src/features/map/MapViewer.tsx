"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlockFeature, VineyardStat } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function processCoords(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry) return null;
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;

  function traverse(coords: any) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  }

  const coordinates = geometry.coordinates || geometry;
  traverse(coordinates);

  if (minLng === Infinity || maxLng === -Infinity || minLat === Infinity || maxLat === -Infinity) {
    return null;
  }

  return [[minLng, minLat], [maxLng, maxLat]];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlockFeature | null>(null)
  const [selectedStats, setSelectedStats] = useState<VineyardStat[]>([])
  
  const { blocksGeoJSON, blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  const blocksRef = useRef<VineyardBlockFeature[]>(blocks);
  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose test hook for selecting a block programmatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId?: string) => {
        const targetBlock = blocksRef.current.find(b => b.properties.id === blockId) || blocksRef.current[0];
        if (targetBlock) {
          const stats = await getBlockStats(targetBlock.properties.id);
          setSelectedBlock(targetBlock);
          setSelectedStats(stats);
        }
      };
    }
  }, [getBlockStats]);

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && blocks.length === 0)) return

    if (mapInstance.current) {
      const source = mapInstance.current.getSource('vineyard-blocks-source') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(blocksGeoJSON as any);
      }
      return;
    }

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
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: blocksGeoJSON as any,
        generateId: true
      })

      map.addLayer({
        id: 'vineyard-fill-layer',
        type: 'fill',
        source: 'vineyard-blocks-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.35
          ]
        }
      })

      map.addLayer({
        id: 'vineyard-line-layer',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#34d399',
          'line-width': 2
        }
      })

      // Auto fit bounds to blocks geometry
      if (blocksGeoJSON.features && blocksGeoJSON.features.length > 0) {
        const allBounds = processCoords(blocksGeoJSON);
        if (allBounds) {
          map.fitBounds(allBounds, { padding: 80, maxZoom: 14 });
        }
      }

      map.on('mousemove', 'vineyard-fill-layer', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const feature = e.features[0];
        if (feature.id !== undefined) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== feature.id) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          hoveredIdRef.current = feature.id;
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: feature.id },
            { hover: true }
          );
        }
      })

      map.on('mouseleave', 'vineyard-fill-layer', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      map.on('click', 'vineyard-fill-layer', async (e) => {
        if (!e.features || e.features.length === 0) return
        const featureProps = e.features[0].properties;
        const blockId = featureProps.id;

        const targetBlock = blocksRef.current.find(b => b.properties.id === blockId);
        if (targetBlock) {
          const stats = await getBlockStats(targetBlock.properties.id);
          setSelectedBlock(targetBlock);
          setSelectedStats(stats);

          const bounds = processCoords(targetBlock.geometry);
          if (bounds) {
            map.fitBounds(bounds, { padding: 100, maxZoom: 15, duration: 1000 });
          }
        }
      })
    })

    return () => {
      map.remove();
      mapInstance.current = null;
    }
  }, [isMounted, blocksLoading])

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
          timeSeries={selectedStats}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  )
}
