
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import type { SpatialPoint } from '@/types/database.types'
import { MOCK_STATIONS } from '@/lib/mock-data/stations'
import StationPanel from './components/StationPanel'
import { Station } from '@/types/stations'

interface MapViewerProps {
  points?: SpatialPoint[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !mapContainer.current) return

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

    // Position navigation controls at bottom-left
    map.addControl(new maplibregl.NavigationControl(), 'bottom-left')

    map.on('load', () => {
      // 1. Reference Phenology Stations Layer
      map.addSource('stations-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: MOCK_STATIONS.map(s => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: s.coordinates
            },
            properties: {
              id: s.id,
              name: s.name,
              country: s.country
            }
          }))
        }
      })

      map.addLayer({
        id: 'stations-layer',
        type: 'circle',
        source: 'stations-data',
        paint: {
          'circle-radius': 10,
          'circle-color': '#10b981',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      })

      // Symbol layer for Station labels
      map.addLayer({
        id: 'stations-labels',
        type: 'symbol',
        source: 'stations-data',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      })

      // Click Handlers for stations
      map.on('click', 'stations-layer', (e) => {
        if (!e.features || e.features.length === 0) return
        const stationId = e.features[0].properties.id
        const station = MOCK_STATIONS.find(s => s.id === stationId)
        if (station) {
          setSelectedStation(station)
          map.flyTo({
            center: station.coordinates,
            zoom: 8,
            essential: true
          })
        }
      })

      // Mouse feedback
      map.on('mouseenter', 'stations-layer', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'stations-layer', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    return () => {
      map.remove()
    }
  }, [isMounted])

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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
      
      {selectedStation && (
        <StationPanel 
          station={selectedStation} 
          onClose={() => setSelectedStation(null)} 
        />
      )}
    </div>
  )
}
