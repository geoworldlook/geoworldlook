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

  // Reffy zapobiegające nieświeżym domknięciom w zdarzeniach MapLibre
  const blocksRef = useRef<VineyardBlock[]>(blocks);
  const hoveredIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Funkcja pomocnicza do rekurencyjnego wyciągania współrzędnych z geometrii i liczenia granic
  const processCoords = (geom: any): [number, number][] => {
    if (!geom) return [];
    if (geom.coordinates) {
      return processCoords(geom.coordinates);
    }
    if (Array.isArray(geom)) {
      if (typeof geom[0] === 'number' && typeof geom[1] === 'number') {
        return [geom as [number, number]];
      }
      return geom.flatMap(item => processCoords(item));
    }
    return [];
  };

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
      const geojsonFeatureCollection = {
        type: 'FeatureCollection',
        features: blocks.map((b, idx) => ({
          type: 'Feature',
          id: idx, // numeryczne ID wymagane do feature-state w MapLibre
          geometry: b.geom,
          properties: {
            id: b.id,
            name: b.name,
            area_ha: b.area_ha
          }
        }))
      };

      map.addSource('vineyard-blocks-source', {
        type: 'geojson',
        data: geojsonFeatureCollection,
        generateId: true // generowanie wewnętrznych unikalnych ID dla stanów interakcji
      })

      // 1. Warstwa wypełnienia (fill)
      map.addLayer({
        id: 'vineyard-fill',
        type: 'fill',
        source: 'vineyard-blocks-source',
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

      // 2. Warstwa krawędzi (line)
      map.addLayer({
        id: 'vineyard-line',
        type: 'line',
        source: 'vineyard-blocks-source',
        paint: {
          'line-color': '#10b981',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            1.5
          ],
          'line-opacity': 0.9
        }
      })

      // Automatyczne dopasowanie kamery do granic poligonów (fitBounds)
      const allCoords = blocks.flatMap(b => processCoords(b.geom));
      if (allCoords.length > 0) {
        const bounds = allCoords.reduce(
          (acc, coord) => {
            return [
              [Math.min(acc[0][0], coord[0]), Math.min(acc[0][1], coord[1])],
              [Math.max(acc[1][0], coord[0]), Math.max(acc[1][1], coord[1])]
            ];
          },
          [[allCoords[0][0], allCoords[0][1]], [allCoords[0][0], allCoords[0][1]]]
        );
        map.fitBounds(bounds as maplibregl.LngLatBoundsLike, { padding: 50, maxZoom: 14 });
      }

      // Interakcja hover (najechanie myszą)
      map.on('mousemove', 'vineyard-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';

        const featureId = e.features[0].id;
        if (featureId !== undefined && featureId !== null) {
          if (hoveredIdRef.current !== null && hoveredIdRef.current !== featureId) {
            map.setFeatureState(
              { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
              { hover: false }
            );
          }
          hoveredIdRef.current = featureId;
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: featureId },
            { hover: true }
          );
        }
      });

      map.on('mouseleave', 'vineyard-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredIdRef.current !== null) {
          map.setFeatureState(
            { source: 'vineyard-blocks-source', id: hoveredIdRef.current },
            { hover: false }
          );
          hoveredIdRef.current = null;
        }
      });

      // Obsługa kliknięcia w poligon
      map.on('click', 'vineyard-fill', async (e) => {
        if (!e.features || e.features.length === 0) return;

        // MapLibre nadpisuje/ignoruje główne ID dla stanów interakcji,
        // dlatego pobieramy oryginalne ID biznesowe z obiektu properties.
        const blockId = e.features[0].properties.id;
        const blockBase = blocksRef.current.find(b => b.id === blockId);

        if (blockBase) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...blockBase, timeSeries: stats });

          // Wyznaczenie środka poligonu dla płynnego przejścia flyTo
          const coords = processCoords(blockBase.geom);
          if (coords.length > 0) {
            const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
            const centroid: [number, number] = [sum[0] / coords.length, sum[1] / coords.length];
            map.flyTo({
              center: centroid,
              zoom: 13,
              essential: true
            });
          }
        }
      });
    })

    return () => {
      map.remove()
    }
  }, [isMounted, blocks, blocksLoading])

  // Ekspozycja test-hooka na globalnym obiekcie window do celów automatycznego testowania UI
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).selectBlockForTesting = async (blockId: string) => {
        const found = blocksRef.current.find(b => b.id === blockId);
        if (found) {
          const stats = await getBlockStats(blockId);
          setSelectedBlock({ ...found, timeSeries: stats });

          if (mapInstance.current) {
            const coords = processCoords(found.geom);
            if (coords.length > 0) {
              const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
              const centroid: [number, number] = [sum[0] / coords.length, sum[1] / coords.length];
              mapInstance.current.flyTo({ center: centroid, zoom: 13 });
            }
          }
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).selectBlockForTesting;
      }
    };
  }, [getBlockStats]);

  if (!isMounted || (blocksLoading && blocks.length === 0)) {
    return (
      <div className="w-full h-full rounded-xl bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest text-center">
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
