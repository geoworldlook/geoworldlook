"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import type { SpatialPoint, VineyardBlockWithStats } from '@/types/database.types'

interface MapViewerProps {
  points?: SpatialPoint[]
  blocks?: VineyardBlockWithStats[]
}

export default function MapViewer({ points, blocks }: MapViewerProps) {
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
      if (blocks && blocks.length > 0) {
        map.addSource('vineyard-blocks', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: blocks.map(b => ({
              type: 'Feature',
              geometry: b.geom,
              properties: {
                id: b.id,
                name: b.name,
                area: b.area_ha,
                ndvi: b.latest_stats?.ndvi_mean,
                ndmi: b.latest_stats?.ndmi_mean,
                date: b.latest_stats?.date
              }
            }))
          }
        })

        map.addLayer({
          id: 'vineyard-blocks-fill',
          type: 'fill',
          source: 'vineyard-blocks',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'ndvi'],
              0, '#ef4444',
              0.5, '#f59e0b',
              0.8, '#10b981'
            ],
            'fill-opacity': 0.6
          }
        })

        map.addLayer({
          id: 'vineyard-blocks-outline',
          type: 'line',
          source: 'vineyard-blocks',
          paint: {
            'line-color': '#ffffff',
            'line-width': 1
          }
        })

        map.on('click', 'vineyard-blocks-fill', (e) => {
          if (!e.features || e.features.length === 0) return

          const feature = e.features[0]
          const { name, area, ndvi, ndmi, date } = feature.properties as any

          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="p-2 text-black">
                <h3 class="font-bold text-sm mb-1">${name}</h3>
                <p class="text-xs">Area: ${area} ha</p>
                ${ndvi ? `<p class="text-xs">NDVI: ${ndvi.toFixed(3)}</p>` : ''}
                ${ndmi ? `<p class="text-xs">NDMI: ${ndmi.toFixed(3)}</p>` : ''}
                ${date ? `<p class="text-xs text-gray-500 mt-1">Data: ${date}</p>` : ''}
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

        // Fit bounds to blocks
        const bounds = new maplibregl.LngLatBounds()
        blocks.forEach(b => {
          if (b.geom.type === 'Polygon') {
            b.geom.coordinates[0].forEach((coord: number[]) => {
              bounds.extend(coord as [number, number])
            })
          }
        })
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 50 })
        }
      }

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
  }, [isMounted, points])

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
