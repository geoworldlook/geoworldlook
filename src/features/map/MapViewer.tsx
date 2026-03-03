"use client"

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MAP_CONFIG } from './config'
import type { SpatialPoint } from '@/types/database.types'

interface MapViewerProps {
  points?: SpatialPoint[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

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
  }, [points])

  return <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
}
