"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

function processCoords(geom: any): [number, number][] {
  if (!geom) return [];
  if (geom.coordinates) {
    return processCoords(geom.coordinates);
  }
  if (Array.isArray(geom)) {
    if (typeof geom[0] === 'number' && typeof geom[1] === 'number') {
      return [geom as [number, number]];
    }
    return geom.flatMap(item => processCoords(item));
  }
  return [];
}

function getBounds(coords: [number, number][]): maplibregl.LngLatBoundsLike | null {
  if (coords.length === 0) return null;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [minLng, minLat, maxLng, maxLat];
}

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocksGeoJSON, loading: blocksLoading, getBlockStats } = useVineyardData();

  // Create Refs for state variables to be used in event listeners
  const blocksRef = useRef<any>(null);
  const hoveredIdRef = useRef<number | null>(null);

  useEffect(() => {
    blocksRef.current = blocksGeoJSON;
  }, [blocksGeoJSON]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Map initialization
  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && !blocksGeoJSON)) return

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
      // Add GeoJSON source for vineyard blocks
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: blocksGeoJSON || { type: 'FeatureCollection', features: [] },
        generateId: true
      })

      // Fill Layer with interactive opacity hover state
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

      // Outline Layer
      map.addLayer({
        id: 'blocks-line',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      // Fit bounds to all blocks initially if we have any
      if (blocksGeoJSON) {
        const coords = processCoords(blocksGeoJSON);
        const bounds = getBounds(coords);
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 80,
            maxZoom: 13,
            duration: 800
          });
        }
      }

      // Hover Interaction: mousemove
      map.on('mousemove', 'blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';
          const feature = e.features[0];
          const internalId = feature.id as number;

          if (hoveredIdRef.current !== null && hoveredIdRef.current !== internalId) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredIdRef.current },
              { hover: false }
            );
          }

          hoveredIdRef.current = internalId;
          map.setFeatureState(
            { source: 'vineyard-blocks', id: internalId },
            { hover: true }
          );
        }
      })

      // Hover Interaction: mouseleave
      map.on('mouseleave', 'blocks-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      })

      // Click Interaction
      map.on('click', 'blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0];
        const blockId = feature.properties?.id;
        const blockName = feature.properties?.name;
        const blockArea = feature.properties?.area_ha;

        if (blockId) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({
            id: blockId,
            name: blockName,
            area_ha: Number(blockArea),
            geom: feature.geometry,
            timeSeries: stats
          });

          const coords = processCoords(feature.geometry);
          const bounds = getBounds(coords);
          if (bounds) {
            map.fitBounds(bounds, {
              padding: 60,
              maxZoom: 14,
              duration: 1000
            })
          }
        }
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Optimize updates: using source.setData() when data changes instead of re-initializing the map
  useEffect(() => {
    if (mapInstance.current && blocksGeoJSON) {
      const source = mapInstance.current.getSource('vineyard-blocks') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData(blocksGeoJSON);

        // Fit bounds on dataset updates
        const coords = processCoords(blocksGeoJSON);
        const bounds = getBounds(coords);
        if (bounds) {
          mapInstance.current.fitBounds(bounds, {
            padding: 80,
            maxZoom: 13,
            duration: 800
          });
        }
      }
    }
  }, [blocksGeoJSON])

  // Automated testing hook
  useEffect(() => {
    (window as any).selectBlockForTesting = async (id: string) => {
      const features = blocksRef.current?.features || [];
      const feature = features.find((f: any) => f.properties?.id === id);
      if (feature) {
        const stats = await getBlockStats(id);
        setSelectedBlock({
          id: feature.properties.id,
          name: feature.properties.name,
          area_ha: Number(feature.properties.area_ha),
          geom: feature.geometry,
          timeSeries: stats
        });

        if (mapInstance.current) {
          const coords = processCoords(feature.geometry);
          const bounds = getBounds(coords);
          if (bounds) {
            mapInstance.current.fitBounds(bounds, {
              padding: 60,
              maxZoom: 14,
              duration: 1000
            });
          }
        }
      }
    };

    return () => {
      delete (window as any).selectBlockForTesting;
    }
  }, [getBlockStats])

  if (!isMounted || (blocksLoading && !blocksGeoJSON)) {
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
