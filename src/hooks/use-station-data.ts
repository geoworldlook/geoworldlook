'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlockData, VineyardBlockTimeSeries } from '@/types/stations';

// Mock polygon vineyard data for fallback when Supabase data is unavailable
const MOCK_VINEYARD_BLOCKS: VineyardBlockData[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 4.5,
    coordinates: [
      [
        [15.500, 51.930],
        [15.508, 51.930],
        [15.508, 51.935],
        [15.500, 51.935],
        [15.500, 51.930]
      ]
    ],
    timeSeries: []
  },
  {
    id: 'block-2',
    name: 'Parcela Sud Sangiovese',
    area_ha: 3.2,
    coordinates: [
      [
        [15.510, 51.920],
        [15.518, 51.920],
        [15.518, 51.925],
        [15.510, 51.925],
        [15.510, 51.920]
      ]
    ],
    timeSeries: []
  },
  {
    id: 'block-3',
    name: 'Parcela Est Chardonnay',
    area_ha: 5.8,
    coordinates: [
      [
        [15.520, 51.932],
        [15.529, 51.932],
        [15.529, 51.938],
        [15.520, 51.938],
        [15.520, 51.932]
      ]
    ],
    timeSeries: []
  }
];

const MOCK_TIME_SERIES: Record<string, VineyardBlockTimeSeries[]> = {
  'block-1': [
    { date: '2023-05-01', ndvi_mean: 0.42, ndmi_mean: 0.15, cloud_cover: 5 },
    { date: '2023-06-01', ndvi_mean: 0.65, ndmi_mean: 0.28, cloud_cover: 12 },
    { date: '2023-07-01', ndvi_mean: 0.78, ndmi_mean: 0.35, cloud_cover: 8 },
    { date: '2023-08-01', ndvi_mean: 0.72, ndmi_mean: 0.22, cloud_cover: 3 },
    { date: '2023-09-01', ndvi_mean: 0.58, ndmi_mean: 0.18, cloud_cover: 15 },
    { date: '2023-10-01', ndvi_mean: 0.45, ndmi_mean: 0.10, cloud_cover: 22 }
  ],
  'block-2': [
    { date: '2023-05-01', ndvi_mean: 0.38, ndmi_mean: 0.12, cloud_cover: 5 },
    { date: '2023-06-01', ndvi_mean: 0.59, ndmi_mean: 0.24, cloud_cover: 12 },
    { date: '2023-07-01', ndvi_mean: 0.71, ndmi_mean: 0.30, cloud_cover: 8 },
    { date: '2023-08-01', ndvi_mean: 0.68, ndmi_mean: 0.19, cloud_cover: 3 },
    { date: '2023-09-01', ndvi_mean: 0.52, ndmi_mean: 0.14, cloud_cover: 15 },
    { date: '2023-10-01', ndvi_mean: 0.40, ndmi_mean: 0.08, cloud_cover: 22 }
  ],
  'block-3': [
    { date: '2023-05-01', ndvi_mean: 0.45, ndmi_mean: 0.18, cloud_cover: 5 },
    { date: '2023-06-01', ndvi_mean: 0.69, ndmi_mean: 0.31, cloud_cover: 12 },
    { date: '2023-07-01', ndvi_mean: 0.82, ndmi_mean: 0.39, cloud_cover: 8 },
    { date: '2023-08-01', ndvi_mean: 0.76, ndmi_mean: 0.26, cloud_cover: 3 },
    { date: '2023-09-01', ndvi_mean: 0.61, ndmi_mean: 0.21, cloud_cover: 15 },
    { date: '2023-10-01', ndvi_mean: 0.48, ndmi_mean: 0.12, cloud_cover: 22 }
  ]
};

/**
 * Custom hook for managing GIS vineyard block data from Supabase.
 * - Fetches all vineyard blocks (polygons) for map display.
 * - Fetches historical satellite stats (NDVI & NDMI time-series) for a specific vineyard block.
 */
export function useStationData() {
  const [blocks, setBlocks] = useState<VineyardBlockData[]>(MOCK_VINEYARD_BLOCKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        // Try fetching GeoJSON from Supabase RPC or table
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (!rpcError && rpcData && rpcData.features && rpcData.features.length > 0) {
          const formatted: VineyardBlockData[] = rpcData.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha || 0,
            coordinates: f.geometry.coordinates,
            timeSeries: []
          }));
          setBlocks(formatted);
          return;
        }

        const { data, error: tableError } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (tableError) throw tableError;

        if (data && data.length > 0) {
          const formatted: VineyardBlockData[] = data.map((b: any) => {
            let coords: [number, number][][] = [];
            if (typeof b.geom === 'string') {
              try {
                const parsed = JSON.parse(b.geom);
                coords = parsed.coordinates;
              } catch (e) {
                coords = MOCK_VINEYARD_BLOCKS[0].coordinates;
              }
            } else if (b.geom && b.geom.coordinates) {
              coords = b.geom.coordinates;
            } else {
              coords = MOCK_VINEYARD_BLOCKS[0].coordinates;
            }

            return {
              id: b.id,
              name: b.name,
              area_ha: Number(b.area_ha) || 0,
              coordinates: coords,
              timeSeries: []
            };
          });
          setBlocks(formatted);
        }
      } catch (err: any) {
        console.warn('Using mock vineyard blocks fallback:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardBlockTimeSeries[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((d: any) => ({
          date: d.date,
          ndvi_mean: Number(d.ndvi_mean ?? d.ndvi_index ?? 0),
          ndmi_mean: Number(d.ndmi_mean ?? 0),
          cloud_cover: Number(d.cloud_cover ?? 0)
        }));
      }

      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1'];
    } catch (err: any) {
      console.warn(`Using mock stats for block ${blockId}:`, err.message);
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1'];
    }
  }

  return {
    blocks,
    stations: blocks, // Alias for backward compatibility
    loading,
    error,
    getBlockStats,
    getStationStats: getBlockStats // Alias for backward compatibility
  };
}

export const useVineyardData = useStationData;
