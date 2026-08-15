"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyards'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<(VineyardBlock & { timeSeries: VineyardTimeSeries[] }) | null>(null)
  
  const { blocks, featureCollection, loading: blocksLoading, getBlockStats } = useVineyardData()
  const hoveredBlockIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const timeSeries = await getBlockStats(blockId);
        const b = blocks.find(x => x.id === blockId) || {
          id: blockId,
          name: 'Parcela Nord Nebbiolo',
          area_ha: 4.25,
          geom: null
        };
        setSelectedBlock({ ...b, timeSeries });
      };
    }
  }, [blocks, getBlockStats]);

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
      // Add GeoJSON polygon source
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: featureCollection,
        generateId: true
      })

      // Polygon fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.65,
            0.35
          ]
        }
      })

      // Polygon border line layer
      map.addLayer({
        id: 'vineyard-blocks-outline',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#34d399',
          'line-width': 2,
          'line-opacity': 0.9
        }
      })

      // Fit map bounds to vineyard polygons if available
      if (featureCollection.features.length > 0) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
        featureCollection.features.forEach(f => {
          f.geometry.coordinates[0].forEach(([lng, lat]) => {
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
          })
        })

        if (minLng !== Infinity) {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 80,
            maxZoom: 15,
            duration: 1000
          })
        }
      }

      // Handle polygon click
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0]
        const blockId = feature.properties?.id || feature.id

        const blockBase = blocks.find(b => b.id === blockId) || {
          id: String(blockId),
          name: feature.properties?.name || 'Vineyard Block',
          area_ha: feature.properties?.area_ha || 0,
          geom: feature.geometry
        }
        
        const timeSeries = await getBlockStats(String(blockId))
        setSelectedBlock({ ...blockBase, timeSeries })

        // Calculate polygon centroid or bounds to fly to
        const coords = (feature.geometry as any).coordinates[0]
        if (coords && coords.length > 0) {
          let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
          coords.forEach(([lng, lat]: [number, number]) => {
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
          })
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: 100,
            maxZoom: 16,
            duration: 800
          })
        }
      })

      // Handle mouse enter / hover
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredBlockIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredBlockIdRef.current },
              { hover: false }
            )
          }
          hoveredBlockIdRef.current = e.features[0].id ?? null
          if (hoveredBlockIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredBlockIdRef.current },
              { hover: true }
            )
          }
        }
      })

      // Handle mouse leave
      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredBlockIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredBlockIdRef.current },
            { hover: false }
          )
        }
        hoveredBlockIdRef.current = null
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted, featureCollection, blocksLoading])

  if (!isMounted || blocksLoading) {
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
