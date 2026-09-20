'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeriesPoint } from '@/types/vineyard';

const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 4.25,
    geom: {
      type: 'Feature',
      id: 'block-1',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.501, 51.931],
            [15.508, 51.931],
            [15.507, 51.936],
            [15.500, 51.935],
            [15.501, 51.931]
          ]
        ]
      },
      properties: {
        id: 'block-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 4.25
      }
    }
  },
  {
    id: 'block-2',
    name: 'Sektor Południowy Riesling',
    area_ha: 6.80,
    geom: {
      type: 'Feature',
      id: 'block-2',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.512, 51.928],
            [15.520, 51.927],
            [15.519, 51.933],
            [15.510, 51.932],
            [15.512, 51.928]
          ]
        ]
      },
      properties: {
        id: 'block-2',
        name: 'Sektor Południowy Riesling',
        area_ha: 6.80
      }
    }
  },
  {
    id: 'block-3',
    name: 'Winnica Wzgórze Pinot Noir',
    area_ha: 3.10,
    geom: {
      type: 'Feature',
      id: 'block-3',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.492, 51.925],
            [15.498, 51.924],
            [15.499, 51.929],
            [15.491, 51.929],
            [15.492, 51.925]
          ]
        ]
      },
      properties: {
        id: 'block-3',
        name: 'Winnica Wzgórze Pinot Noir',
        area_ha: 3.10
      }
    }
  }
];

const MOCK_TIME_SERIES: Record<string, VineyardTimeSeriesPoint[]> = {
  'block-1': [
    { date: '2025-05-01', cloud_cover: 5.2, ndvi_mean: 0.42, ndmi_mean: 0.15 },
    { date: '2025-06-01', cloud_cover: 12.0, ndvi_mean: 0.65, ndmi_mean: 0.28 },
    { date: '2025-07-01', cloud_cover: 2.1, ndvi_mean: 0.78, ndmi_mean: 0.32 },
    { date: '2025-08-01', cloud_cover: 8.4, ndvi_mean: 0.74, ndmi_mean: 0.21 },
    { date: '2025-09-01', cloud_cover: 15.0, ndvi_mean: 0.61, ndmi_mean: 0.12 },
    { date: '2025-10-01', cloud_cover: 4.5, ndvi_mean: 0.48, ndmi_mean: 0.05 }
  ],
  'block-2': [
    { date: '2025-05-01', cloud_cover: 5.2, ndvi_mean: 0.38, ndmi_mean: 0.10 },
    { date: '2025-06-01', cloud_cover: 12.0, ndvi_mean: 0.59, ndmi_mean: 0.22 },
    { date: '2025-07-01', cloud_cover: 2.1, ndvi_mean: 0.72, ndmi_mean: 0.27 },
    { date: '2025-08-01', cloud_cover: 8.4, ndvi_mean: 0.69, ndmi_mean: 0.18 },
    { date: '2025-09-01', cloud_cover: 15.0, ndvi_mean: 0.55, ndmi_mean: 0.08 },
    { date: '2025-10-01', cloud_cover: 4.5, ndvi_mean: 0.41, ndmi_mean: 0.02 }
  ],
  'block-3': [
    { date: '2025-05-01', cloud_cover: 5.2, ndvi_mean: 0.45, ndmi_mean: 0.18 },
    { date: '2025-06-01', cloud_cover: 12.0, ndvi_mean: 0.71, ndmi_mean: 0.35 },
    { date: '2025-07-01', cloud_cover: 2.1, ndvi_mean: 0.82, ndmi_mean: 0.39 },
    { date: '2025-08-01', cloud_cover: 8.4, ndvi_mean: 0.79, ndmi_mean: 0.29 },
    { date: '2025-09-01', cloud_cover: 15.0, ndvi_mean: 0.66, ndmi_mean: 0.19 },
    { date: '2025-10-01', cloud_cover: 4.5, ndvi_mean: 0.52, ndmi_mean: 0.09 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const hasSupabaseKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!hasSupabaseUrl || !hasSupabaseKey) {
        console.warn('Supabase environment variables missing; using mock vineyard blocks.');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error || !data || (Array.isArray(data) && data.length === 0)) {
          console.warn('Supabase RPC get_vineyard_blocks_geojson returned empty or error, falling back to mock data:', error);
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          const rawFeatures = Array.isArray(data) ? data : (data.features || []);
          const formattedBlocks: VineyardBlock[] = rawFeatures.map((feat: any) => ({
            id: feat.id || feat.properties?.id,
            name: feat.properties?.name || 'Winnica Parcela',
            area_ha: Number(feat.properties?.area_ha || 0),
            geom: feat
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeriesPoint[]> {
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1'];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1'];
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1'];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
