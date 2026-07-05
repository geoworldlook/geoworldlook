
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

export default function MapViewer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize Map
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
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        generateId: true
      })

      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-data',
        paint: {
          'fill-color': '#10b981',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.6,
            0.4
          ]
        }
      })

      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2
        }
      })

      let hoveredStateId: string | number | null = null

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredStateId },
              { hover: false }
            )
          }
          hoveredStateId = e.features[0].id || null
          if (hoveredStateId !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredStateId },
              { hover: true }
            )
          }
          map.getCanvas().style.cursor = 'pointer'
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredStateId !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredStateId },
            { hover: false }
          )
        }
        hoveredStateId = null
        map.getCanvas().style.cursor = ''
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        // MapLibre uses internal ID if generateId: true is set, but we stored our business ID in properties.
        const blockId = e.features[0].properties.id
        const blockBase = (blocksRef.current || []).find(b => b.id === blockId)

        if (blockBase) {
          const stats = await getBlockStatsRef.current(blockId)
          setSelectedBlock({ ...blockBase, stats })

          if (blockBase.geom.type === 'Polygon') {
            const coords = blockBase.geom.coordinates[0][0]
            map.flyTo({
              center: coords as [number, number],
              zoom: 15,
              essential: true
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

  // Use refs to avoid re-initializing the map when data changes
  const blocksRef = useRef(blocks)
  const getBlockStatsRef = useRef(getBlockStats)

  useEffect(() => {
    blocksRef.current = blocks
    getBlockStatsRef.current = getBlockStats

    const map = mapInstance.current
    if (!map || !map.isStyleLoaded() || blocksLoading) return

    const source = map.getSource('vineyard-data') as maplibregl.GeoJSONSource
    if (source) {
      const geojson: any = {
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
      source.setData(geojson)

      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        blocks.forEach(b => {
          if (b.geom.type === 'Polygon') {
            b.geom.coordinates[0].forEach((coord: any) => {
              bounds.extend(coord as [number, number])
            })
          }
        })
        map.fitBounds(bounds, { padding: 50, animate: false })
      }
    }
  }, [blocks, blocksLoading, getBlockStats])

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
