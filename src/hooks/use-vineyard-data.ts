'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for cases where Supabase is not configured or table is empty
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.930],
        [15.515, 51.930],
        [15.515, 51.935],
        [15.510, 51.935],
        [15.510, 51.930]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'block-2',
    name: 'South Slope Chardonnay',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.920],
        [15.525, 51.920],
        [15.525, 51.925],
        [15.520, 51.925],
        [15.520, 51.920]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 20, ndvi_mean: 0.6, ndmi_mean: 0.5 },
    { date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.8, ndmi_mean: 0.7 }
  ],
  'block-2': [
    { date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.15, ndmi_mean: 0.05 },
    { date: '2024-02-01', cloud_cover: 8, ndvi_mean: 0.22, ndmi_mean: 0.12 },
    { date: '2024-03-01', cloud_cover: 18, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 22, ndvi_mean: 0.55, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.75, ndmi_mean: 0.65 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
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
