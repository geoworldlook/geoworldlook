
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 4.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.50, 51.90],
        [15.52, 51.90],
        [15.52, 51.91],
        [15.50, 51.91],
        [15.50, 51.90]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'block-2',
    name: 'South Slope Chardonnay',
    area_ha: 3.2,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.53, 51.88],
        [15.55, 51.88],
        [15.55, 51.89],
        [15.53, 51.89],
        [15.53, 51.88]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { block_id: 'block-1', date: '2024-04-01', cloud_cover: 0, ndvi_mean: 0.6, ndmi_mean: 0.5 },
    { block_id: 'block-1', date: '2024-05-01', cloud_cover: 15, ndvi_mean: 0.75, ndmi_mean: 0.6 }
  ],
  'block-2': [
    { block_id: 'block-2', date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.18, ndmi_mean: 0.08 },
    { block_id: 'block-2', date: '2024-05-01', cloud_cover: 8, ndvi_mean: 0.72, ndmi_mean: 0.58 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>(MOCK_BLOCKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn("Supabase env vars missing — using mock data");
        setLoading(false);
        return;
      }

      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
           console.warn("Using mock data due to Supabase error:", error);
           setBlocks(MOCK_BLOCKS);
        } else if (data && data.length > 0) {
           setBlocks(data);
        }
      } catch (err: any) {
        console.warn('Error fetching vineyard blocks, using mock data:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return MOCK_STATS[blockId] || [];
    }

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.warn(`Error fetching stats for block ${blockId}, using mock data`);
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
