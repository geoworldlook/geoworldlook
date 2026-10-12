'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyard';

// Mock GeoJSON FeatureCollection for Zielona Góra vineyard region
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    name: 'Winnica Winnogóra - Parcela Pinot Noir',
    area_ha: 3.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.518, 51.932],
        [15.525, 51.933],
        [15.524, 51.928],
        [15.517, 51.927],
        [15.518, 51.932]
      ]]
    },
    timeSeries: []
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    name: 'Winnica Stara Winna Góra - Parcela Riesling',
    area_ha: 5.2,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.558, 51.951],
        [15.567, 51.953],
        [15.565, 51.947],
        [15.556, 51.945],
        [15.558, 51.951]
      ]]
    },
    timeSeries: []
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    name: 'Winnica Kinga - Parcela Solar',
    area_ha: 2.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.478, 51.912],
        [15.485, 51.914],
        [15.483, 51.908],
        [15.476, 51.907],
        [15.478, 51.912]
      ]]
    },
    timeSeries: []
  }
];

const MOCK_TIME_SERIES: Record<string, VineyardTimeSeries[]> = {
  'b1111111-1111-1111-1111-111111111111': [
    { date: '2024-01-15', ndvi_mean: 0.25, ndmi_mean: 0.12, cloud_cover: 15.0 },
    { date: '2024-02-15', ndvi_mean: 0.28, ndmi_mean: 0.15, cloud_cover: 22.0 },
    { date: '2024-03-15', ndvi_mean: 0.38, ndmi_mean: 0.21, cloud_cover: 10.0 },
    { date: '2024-04-15', ndvi_mean: 0.52, ndmi_mean: 0.30, cloud_cover: 8.5 },
    { date: '2024-05-15', ndvi_mean: 0.68, ndmi_mean: 0.35, cloud_cover: 12.0 },
    { date: '2024-06-15', ndvi_mean: 0.81, ndmi_mean: 0.28, cloud_cover: 5.0 },
    { date: '2024-07-15', ndvi_mean: 0.85, ndmi_mean: 0.22, cloud_cover: 14.0 },
    { date: '2024-08-15', ndvi_mean: 0.79, ndmi_mean: 0.18, cloud_cover: 9.0 },
    { date: '2024-09-15', ndvi_mean: 0.65, ndmi_mean: 0.15, cloud_cover: 11.0 },
    { date: '2024-10-15', ndvi_mean: 0.45, ndmi_mean: 0.10, cloud_cover: 18.0 },
    { date: '2024-11-15', ndvi_mean: 0.30, ndmi_mean: 0.08, cloud_cover: 25.0 },
    { date: '2024-12-15', ndvi_mean: 0.24, ndmi_mean: 0.05, cloud_cover: 30.0 }
  ],
  'b2222222-2222-2222-2222-222222222222': [
    { date: '2024-01-15', ndvi_mean: 0.22, ndmi_mean: 0.10, cloud_cover: 18.0 },
    { date: '2024-02-15', ndvi_mean: 0.26, ndmi_mean: 0.14, cloud_cover: 19.0 },
    { date: '2024-03-15', ndvi_mean: 0.35, ndmi_mean: 0.19, cloud_cover: 12.0 },
    { date: '2024-04-15', ndvi_mean: 0.49, ndmi_mean: 0.27, cloud_cover: 7.0 },
    { date: '2024-05-15', ndvi_mean: 0.64, ndmi_mean: 0.32, cloud_cover: 10.0 },
    { date: '2024-06-15', ndvi_mean: 0.77, ndmi_mean: 0.25, cloud_cover: 6.0 },
    { date: '2024-07-15', ndvi_mean: 0.82, ndmi_mean: 0.20, cloud_cover: 15.0 },
    { date: '2024-08-15', ndvi_mean: 0.74, ndmi_mean: 0.16, cloud_cover: 8.0 },
    { date: '2024-09-15', ndvi_mean: 0.61, ndmi_mean: 0.13, cloud_cover: 12.0 },
    { date: '2024-10-15', ndvi_mean: 0.42, ndmi_mean: 0.09, cloud_cover: 20.0 },
    { date: '2024-11-15', ndvi_mean: 0.28, ndmi_mean: 0.07, cloud_cover: 22.0 },
    { date: '2024-12-15', ndvi_mean: 0.21, ndmi_mean: 0.04, cloud_cover: 28.0 }
  ],
  'b3333333-3333-3333-3333-333333333333': [
    { date: '2024-01-15', ndvi_mean: 0.20, ndmi_mean: 0.09, cloud_cover: 12.0 },
    { date: '2024-02-15', ndvi_mean: 0.24, ndmi_mean: 0.12, cloud_cover: 16.0 },
    { date: '2024-03-15', ndvi_mean: 0.32, ndmi_mean: 0.18, cloud_cover: 11.0 },
    { date: '2024-04-15', ndvi_mean: 0.46, ndmi_mean: 0.25, cloud_cover: 9.0 },
    { date: '2024-05-15', ndvi_mean: 0.61, ndmi_mean: 0.30, cloud_cover: 14.0 },
    { date: '2024-06-15', ndvi_mean: 0.73, ndmi_mean: 0.22, cloud_cover: 8.0 },
    { date: '2024-07-15', ndvi_mean: 0.78, ndmi_mean: 0.18, cloud_cover: 13.0 },
    { date: '2024-08-15', ndvi_mean: 0.71, ndmi_mean: 0.14, cloud_cover: 10.0 },
    { date: '2024-09-15', ndvi_mean: 0.58, ndmi_mean: 0.11, cloud_cover: 15.0 },
    { date: '2024-10-15', ndvi_mean: 0.39, ndmi_mean: 0.07, cloud_cover: 17.0 },
    { date: '2024-11-15', ndvi_mean: 0.26, ndmi_mean: 0.05, cloud_cover: 24.0 },
    { date: '2024-12-15', ndvi_mean: 0.19, ndmi_mean: 0.03, cloud_cover: 29.0 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!hasEnv) {
          console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        if (data && data.features && data.features.length > 0) {
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id || f.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha || 0),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
        } else {
          setBlocks(MOCK_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getVineyardStats(blockId: string): Promise<VineyardTimeSeries[]> {
    try {
      const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!hasEnv) {
        return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['b1111111-1111-1111-1111-111111111111'];
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['b1111111-1111-1111-1111-111111111111'];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for vineyard block ${blockId}:`, err);
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['b1111111-1111-1111-1111-111111111111'];
    }
  }

  return {
    blocks,
    loading,
    error,
    getVineyardStats
  };
}
