
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'b1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.940],
        [15.525, 51.940],
        [15.525, 51.945],
        [15.520, 51.945],
        [15.520, 51.940]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'b2',
    name: 'Chardonnay South Hill',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.935],
        [15.535, 51.935],
        [15.535, 51.938],
        [15.530, 51.938],
        [15.530, 51.935]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'b1': [
    { date: '2023-10-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.12 },
    { date: '2023-11-01', cloud_cover: 25, ndvi_mean: 0.38, ndmi_mean: 0.15 },
    { date: '2023-12-01', cloud_cover: 40, ndvi_mean: 0.30, ndmi_mean: 0.18 },
    { date: '2024-01-01', cloud_cover: 15, ndvi_mean: 0.25, ndmi_mean: 0.20 },
    { date: '2024-02-01', cloud_cover: 30, ndvi_mean: 0.28, ndmi_mean: 0.22 },
    { date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.42, ndmi_mean: 0.18 },
    { date: '2024-04-01', cloud_cover: 5, ndvi_mean: 0.65, ndmi_mean: 0.10 },
    { date: '2024-05-01', cloud_cover: 12, ndvi_mean: 0.78, ndmi_mean: 0.05 }
  ],
  'b2': [
    { date: '2023-10-01', cloud_cover: 5, ndvi_mean: 0.50, ndmi_mean: 0.10 },
    { date: '2023-11-01', cloud_cover: 20, ndvi_mean: 0.42, ndmi_mean: 0.14 },
    { date: '2023-12-01', cloud_cover: 35, ndvi_mean: 0.35, ndmi_mean: 0.16 },
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.28, ndmi_mean: 0.19 },
    { date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.32, ndmi_mean: 0.21 },
    { date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.48, ndmi_mean: 0.15 },
    { date: '2024-04-01', cloud_cover: 8, ndvi_mean: 0.70, ndmi_mean: 0.08 },
    { date: '2024-05-01', cloud_cover: 10, ndvi_mean: 0.82, ndmi_mean: 0.02 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase credentials missing, using mock data');
          setBlocks(MOCK_BLOCKS);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) throw error;

        if (!data || data.length === 0) {
          setBlocks(MOCK_BLOCKS);
        } else {
          setBlocks(data);
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

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return MOCK_STATS[blockId] || [];
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
