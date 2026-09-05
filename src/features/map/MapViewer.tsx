"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock, VineyardGeoJSONFeature } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocksGeoJSON, loading: blocksLoading, getBlockStats } = useVineyardData()

  // Keep a ref to blocksGeoJSON to access latest value in event callbacks
  const blocksRef = useRef(blocksGeoJSON)
  useEffect(() => {
    blocksRef.current = blocksGeoJSON
  }, [blocksGeoJSON])

  const hoveredIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Expose selectBlockForTesting on window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const feature = blocksRef.current.features.find(f => f.id === blockId || f.properties.id === blockId)
        if (feature) {
          const timeSeries = await getBlockStats(blockId)
          setSelectedBlock({
            id: blockId,
            name: feature.properties.name,
            area_ha: feature.properties.area_ha,
            geom: feature.geometry,
            timeSeries
          })
        }
      }
    }
  }, [getBlockStats])

  // Utility to calculate bounding box of GeoJSON feature collection
  const calculateBounds = (geojson: typeof blocksGeoJSON): maplibregl.LngLatBoundsLike | null => {
    if (!geojson || !geojson.features || geojson.features.length === 0) return null
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity

    const processCoords = (coords: any) => {
      if (typeof coords[0] === 'number') {
        const [lng, lat] = coords
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
      } else if (Array.isArray(coords)) {
        coords.forEach(processCoords)
      }
    }

    geojson.features.forEach(feature => {
      if (feature.geometry) {
        processCoords(feature.geometry.coordinates)
      }
    })

    if (minLng === Infinity || minLat === Infinity) return null
    return [[minLng, minLat], [maxLng, maxLat]]
  }

  // Calculate centroid of a feature geometry
  const calculateCentroid = (feature: VineyardGeoJSONFeature): [number, number] => {
    let sumLng = 0, sumLat = 0, count = 0

    const processCoords = (coords: any) => {
      if (typeof coords[0] === 'number') {
        sumLng += coords[0]
        sumLat += coords[1]
        count++
      } else if (Array.isArray(coords)) {
        coords.forEach(processCoords)
      }
    }

    processCoords(feature.geometry.coordinates)
    return count > 0 ? [sumLng / count, sumLat / count] : MAP_CONFIG.center as [number, number]
  }

  // Initialize MapLibre
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
      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: blocksRef.current,
        generateId: true
      })

      // Fill layer
      map.addLayer({
        id: 'vineyard-blocks-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#34d399', // brighter emerald when hovered
            '#10b981'  // standard emerald
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.35
          ]
        }
      })

      // Outline layer
      map.addLayer({
        id: 'vineyard-blocks-line',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#059669',
          'line-width': 2.5
        }
      })

      // Auto-fit map to blocks bounds if available
      const bounds = calculateBounds(blocksRef.current)
      if (bounds) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 })
      }

      // Hover interaction logic
      map.on('mousemove', 'vineyard-blocks-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          const feature = e.features[0]

          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            )
          }

          hoveredIdRef.current = feature.id!
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: feature.id! },
            { hover: true }
          )

          // Show hover popup
          const name = feature.properties?.name || 'Vineyard Block'
          const area = feature.properties?.area_ha || 'N/A'

          if (!popupRef.current) {
            popupRef.current = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'vineyard-hover-popup'
            })
          }

          popupRef.current
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background-color: #111; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 12px; border: 1px solid #059669;">
                <div style="font-weight: bold; color: #34d399;">${name}</div>
                <div style="color: #9ca3af; font-size: 10px;">Area: ${area} ha</div>
              </div>
            `)
            .addTo(map)
        }
      })

      map.on('mouseleave', 'vineyard-blocks-fill', () => {
        map.getCanvas().style.cursor = ''
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          )
          hoveredIdRef.current = null
        }
        if (popupRef.current) {
          popupRef.current.remove()
        }
      })

      // Click interaction logic
      map.on('click', 'vineyard-blocks-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const feature = e.features[0] as unknown as VineyardGeoJSONFeature
        const blockId = feature.properties.id || feature.id

        const timeSeries = await getBlockStats(blockId)

        const block: VineyardBlock = {
          id: blockId,
          name: feature.properties.name,
          area_ha: feature.properties.area_ha,
          geom: feature.geometry,
          timeSeries
        }

        setSelectedBlock(block)

        const centroid = calculateCentroid(feature)
        map.flyTo({
          center: centroid,
          zoom: 14.5,
          essential: true
        })
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted])

  // Update GeoJSON source when data loads or changes
  useEffect(() => {
    if (mapInstance.current && mapInstance.current.isStyleLoaded()) {
      const source = mapInstance.current.getSource('vineyard-blocks-source') as maplibregl.GeoJSONSource
      if (source) {
        source.setData(blocksGeoJSON)
        const bounds = calculateBounds(blocksGeoJSON)
        if (bounds) {
          mapInstance.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 800 })
        }
      }
    }
  }, [blocksGeoJSON])

  if (!isMounted || (blocksLoading && blocksGeoJSON.features.length === 0)) {
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
