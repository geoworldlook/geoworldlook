"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardBlockGeoJSONCollection } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

function processCoords(coords: any, bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number }) {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    const [lng, lat] = coords;
    if (lng < bounds.minLng) bounds.minLng = lng;
    if (lng > bounds.maxLng) bounds.maxLng = lng;
    if (lat < bounds.minLat) bounds.minLat = lat;
    if (lat > bounds.maxLat) bounds.maxLat = lat;
  } else {
    for (const item of coords) {
      processCoords(item, bounds);
    }
  }
}

function getFeatureBounds(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry) return null;
  const coords = geometry.coordinates || (geometry.geom && geometry.geom.coordinates);
  if (!coords) return null;

  const bounds = { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity };
  processCoords(coords, bounds);

  if (bounds.minLng === Infinity) return null;
  return [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]];
}

function getAllBlocksBounds(geojson: VineyardBlockGeoJSONCollection): [[number, number], [number, number]] | null {
  if (!geojson || !geojson.features || geojson.features.length === 0) return null;
  const bounds = { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity };

  for (const feature of geojson.features) {
    if (feature.geometry) {
      processCoords(feature.geometry.coordinates, bounds);
    }
  }

  if (bounds.minLng === Infinity) return null;
  return [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]];
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const hoveredIdRef = useRef<string | number | null>(null)
  
  const { blocksData, loading: blocksLoading, getBlockStats } = useVineyardData();

  const blocksRef = useRef(blocksData);
  useEffect(() => {
    blocksRef.current = blocksData;
  }, [blocksData]);

  // Expose test helper window.selectBlockForTesting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId?: string) => {
        const currentBlocks = blocksRef.current;
        const targetFeature = currentBlocks.features.find(
          f => f.properties.id === blockId || f.id === blockId
        ) || currentBlocks.features[0];

        if (targetFeature) {
          const bId = targetFeature.properties.id || String(targetFeature.id);
          const stats = await getBlockStats(bId);
          setSelectedBlock({
            id: bId,
            name: targetFeature.properties.name,
            area_ha: targetFeature.properties.area_ha,
            geom: targetFeature.geometry,
            stats
          });
        }
      };
    }
  }, [getBlockStats]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return

    if (mapInstance.current) return; // Map already initialized

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
      // Add source for vineyard blocks
      map.addSource('vineyard-blocks', {
        type: 'geojson',
        data: blocksData,
        generateId: true
      })

      // Add Polygon Fill Layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#059669',
            '#10b981'
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.35
          ]
        }
      })

      // Add Polygon Line/Border Layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks',
        paint: {
          'line-color': '#34d199',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ],
          'line-opacity': 0.9
        }
      })

      // Fit map to vineyard blocks
      const allBounds = getAllBlocksBounds(blocksData);
      if (allBounds) {
        map.fitBounds(allBounds, { padding: 60, maxZoom: 14 })
      }

      // Feature Hover State Listener
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          hoveredIdRef.current = e.features[0].id ?? null;
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks', id: hoveredIdRef.current },
              { hover: true }
            )
          }
          map.getCanvas().style.cursor = 'pointer'
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks', id: hoveredIdRef.current },
            { hover: false }
          )
        }
        hoveredIdRef.current = null;
        map.getCanvas().style.cursor = ''
      })

      // Polygon Click Event Listener
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties.id || String(feature.id)

        const currentBlocks = blocksRef.current;
        const blockGeoFeature = currentBlocks.features.find(
          f => f.properties.id === blockId || f.id === blockId
        );

        const blockName = feature.properties.name || blockGeoFeature?.properties.name || 'Vineyard Block'
        const areaHa = feature.properties.area_ha || blockGeoFeature?.properties.area_ha || 0

        const stats = await getBlockStats(blockId)

        setSelectedBlock({
          id: blockId,
          name: blockName,
          area_ha: Number(areaHa),
          geom: feature.geometry,
          stats
        })

        const bounds = getFeatureBounds(feature.geometry)
        if (bounds) {
          map.fitBounds(bounds, {
            padding: 100,
            maxZoom: 15,
            duration: 1000
          })
        }
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Update source data when blocksData changes after load
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded()) {
      const source = mapInstance.current.getSource('vineyard-blocks') as maplibregl.GeoJSONSource
      if (source) {
        source.setData(blocksData)
        const allBounds = getAllBlocksBounds(blocksData)
        if (allBounds) {
          mapInstance.current.fitBounds(allBounds, { padding: 60, maxZoom: 14 })
        }
      }
    }
  }, [blocksData])

  if (!isMounted || (blocksLoading && blocksData.features.length === 0)) {
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
