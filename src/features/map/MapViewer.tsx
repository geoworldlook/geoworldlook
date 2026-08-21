"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { useVineyardData } from '@/hooks/use-vineyard-data'
import { VineyardBlockProperties, VineyardStats } from '@/types/database.types'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<{
    properties: VineyardBlockProperties;
    stats: VineyardStats[];
  } | null>(null)

  const { blocksGeoJson, loading: blocksLoading, getBlockStats } = useVineyardData()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const feature = blocksGeoJson.features.find(f => f.properties.id === blockId)
        if (feature) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock({ properties: feature.properties, stats })
        }
      }
    }
  }, [blocksGeoJson, getBlockStats])

  useEffect(() => {
    if (!isMounted || !mapContainer.current || (blocksLoading && blocksGeoJson.features.length === 0)) return

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
        data: blocksGeoJson,
        generateId: true
      })

      // Polygon fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#34d399',
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

      // Polygon outline layer
      map.addLayer({
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      let hoveredStateId: string | number | null = null

      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'

          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredStateId },
              { hover: false }
            )
          }

          hoveredStateId = e.features[0].id ?? null
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredStateId },
              { hover: true }
            )
          }
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredStateId },
            { hover: false }
          )
          hoveredStateId = null
        }
      })

      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const properties = feature.properties as VineyardBlockProperties
        const blockId = properties.id

        if (blockId) {
          const stats = await getBlockStats(blockId)
          setSelectedBlock({ properties, stats })

          // Zoom/fit to polygon bounds
          const geom = feature.geometry as any;
          if (geom && geom.coordinates) {
            let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
            const processCoords = (coords: any) => {
              if (typeof coords[0] === 'number') {
                const [lng, lat] = coords;
                if (lng < minLng) minLng = lng;
                if (lng > maxLng) maxLng = lng;
                if (lat < minLat) minLat = lat;
                if (lat > maxLat) maxLat = lat;
              } else {
                coords.forEach(processCoords);
              }
            };
            processCoords(geom.coordinates);

            if (minLng !== Infinity) {
              map.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: 60, maxZoom: 15, duration: 1000 }
              );
            }
          }
        }
      })

      // Calculate initial bounds if blocks available
      if (blocksGeoJson.features.length > 0) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        const processCoords = (coords: any) => {
          if (typeof coords[0] === 'number') {
            const [lng, lat] = coords;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          } else {
            coords.forEach(processCoords);
          }
        };

        blocksGeoJson.features.forEach(f => {
          if (f.geometry && f.geometry.coordinates) {
            processCoords(f.geometry.coordinates);
          }
        });

        if (minLng !== Infinity) {
          map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: 50, maxZoom: 14, duration: 0 }
          );
        }
      }
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocksGeoJson, blocksLoading, getBlockStats])

  if (!isMounted || (blocksLoading && blocksGeoJson.features.length === 0)) {
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
