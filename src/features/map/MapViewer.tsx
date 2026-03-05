"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import type { SpatialPoint, VineyardBlock } from '@/types/database.types'

interface MapViewerProps {
  points?: SpatialPoint[]
  vineyardBlocks?: VineyardBlock[]
}

export default function MapViewer({ points, vineyardBlocks }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return

    // Ensure we are in a browser environment
    if (typeof window === 'undefined') return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    })

    mapInstance.current = map

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right')

    map.on('load', () => {
      // Vineyard Blocks Polygons Layer (Primary)
      if (vineyardBlocks && vineyardBlocks.length > 0) {
        map.addSource('vineyard-blocks', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: vineyardBlocks.map(block => ({
              type: 'Feature',
              geometry: block.geom,
              properties: {
                id: block.id,
                name: block.name,
                area: block.area_ha
              }
            }))
          }
        })

        map.addLayer({
          id: 'vineyard-blocks-fill',
          type: 'fill',
          source: 'vineyard-blocks',
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.4
          }
        })

        map.addLayer({
          id: 'vineyard-blocks-outline',
          type: 'line',
          source: 'vineyard-blocks',
          paint: {
            'line-color': '#34d399',
            'line-width': 2
          }
        })

        map.on('click', 'vineyard-blocks-fill', (e) => {
          if (!e.features || e.features.length === 0) return

          const feature = e.features[0]
          const { name, area } = feature.properties as { name: string, area: number }

          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2 text-black">
                <h3 class="font-bold text-sm mb-1">${name}</h3>
                <p class="text-xs">Area: ${area} ha</p>
              </div>
            `)
            .addTo(map)
        })

        map.on('mouseenter', 'vineyard-blocks-fill', () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', 'vineyard-blocks-fill', () => {
          map.getCanvas().style.cursor = ''
        })

        // Fit map to vineyard blocks
        const bounds = new maplibregl.LngLatBounds()
        vineyardBlocks.forEach(block => {
          if (block.geom.type === 'Polygon') {
            block.geom.coordinates[0].forEach((coord: [number, number]) => bounds.extend(coord))
          }
        })
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50 })
        }
      }

      // Points Layer (Secondary / Transitioned)
      if (points && points.length > 0) {
        map.addSource('spatial-data', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: points.map(p => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [p.lng, p.lat]
              },
              properties: {
                value: p.value,
                title: p.title
              }
            }))
          }
        })

        map.addLayer({
          id: 'spatial-points',
          type: 'circle',
          source: 'spatial-data',
          paint: {
            'circle-radius': 6,
            'circle-color': [
              'interpolate', ['linear'], ['get', 'value'],
              0, '#6b7280',
              0.5, '#10b981',
              1, '#34d399'
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff20'
          }
        })

        map.on('click', 'spatial-points', (e) => {
          if (!e.features || e.features.length === 0) return
          
          const feature = e.features[0]
          const coordinates = (feature.geometry as any).coordinates.slice()
          const { title, value } = feature.properties as { title: string, value: number }

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
          }

          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div class="p-2 text-black">
                <h3 class="font-bold text-sm mb-1">${title}</h3>
                <p class="text-xs">Intensity: ${value.toFixed(2)}</p>
              </div>
            `)
            .addTo(map)
        })

        map.on('mouseenter', 'spatial-points', () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', 'spatial-points', () => {
          map.getCanvas().style.cursor = ''
        })
      }

    })

    return () => {
      map.remove()
    }
  }, [isMounted, points, vineyardBlocks])

  if (!isMounted) {
    return (
      <div className="w-full h-full rounded-xl bg-[#111] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">Loading Spatial Engine...</p>
        </div>
      </div>
    )
  }

  return <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
}
