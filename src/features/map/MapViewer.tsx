
"use client"

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

import { MAP_CONFIG } from './config'
import BlockPanel from './components/BlockPanel'
import { VineyardBlock } from '@/types/vineyard'
import { useVineyardData } from '@/hooks/use-vineyard-data'

interface MapViewerProps {
  points?: any[]
}

export default function MapViewer({ points }: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<VineyardBlock | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | number | null>(null)
  const hoveredIdRef = useRef<string | number | null>(null)
  
  const { blocks, loading: blocksLoading, getBlockStats } = useVineyardData();
  const blocksRef = useRef<VineyardBlock[]>(blocks);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Inicjalizacja Mapy
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
      // Puste źródło na start
      map.addSource('vineyard-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
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
            0.3
          ]
        }
      })

      map.addLayer({
        id: 'vineyard-outline',
        type: 'line',
        source: 'vineyard-data',
        paint: {
          'line-color': '#10b981',
          'line-width': 2
        }
      })

      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return
        const blockId = e.features[0].properties.id
        const blockBase = blocksRef.current.find(b => b.id === blockId)
        
        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, stats });
          
          const coords = processCoords(blockBase.geom);
          if (coords.length > 0) {
            const bounds = new maplibregl.LngLatBounds();
            coords.forEach(c => bounds.extend(c));
            map.flyTo({
              center: bounds.getCenter(),
              zoom: 14,
              essential: true
            });
          }
        }
      })

      map.on('mousemove', 'vineyard-fill', (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = 'pointer'
          if (hoveredIdRef.current !== null) {
            map.setFeatureState(
              { source: 'vineyard-data', id: hoveredIdRef.current },
              { hover: false }
            )
          }
          const newHoveredId = e.features[0].id
          if (newHoveredId !== undefined) {
             hoveredIdRef.current = newHoveredId
             setHoveredBlockId(newHoveredId)
             map.setFeatureState(
                { source: 'vineyard-data', id: newHoveredId },
                { hover: true }
             )
          }
        }
      })

      map.on('mouseleave', 'vineyard-fill', () => {
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-data', id: hoveredIdRef.current },
            { hover: false }
          )
        }
        hoveredIdRef.current = null
        setHoveredBlockId(null)
        map.getCanvas().style.cursor = ''
      })
    })

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [isMounted])

  // Aktualizacja danych bez przeładowania mapy
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !map.isStyleLoaded() || blocksLoading) return;

    const source = map.getSource('vineyard-data') as maplibregl.GeoJSONSource;
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
      };
      source.setData(geojson);

      if (blocks.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        blocks.forEach(b => {
           const coords = processCoords(b.geom);
           coords.forEach(c => bounds.extend(c));
        });
        if (!bounds.isEmpty()) {
           map.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      }
    }
  }, [blocks, blocksLoading]);

  // Pomocnik do wyciągania współrzędnych z różnych typów geometrii
  function processCoords(geom: any): [number, number][] {
    if (!geom || !geom.coordinates) return [];
    if (geom.type === 'Polygon') {
        return geom.coordinates[0];
    } else if (geom.type === 'MultiPolygon') {
        return geom.coordinates.flatMap((p: any) => p[0]);
    }
    return [];
  }

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
