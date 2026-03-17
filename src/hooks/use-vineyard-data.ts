
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat, VineyardBlockWithStats } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'b1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [6.1, 46.4],
        [6.2, 46.4],
        [6.2, 46.5],
        [6.1, 46.5],
        [6.1, 46.4]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'b1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.4, ndmi_mean: 0.2 },
    { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.25 },
    { date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.4 },
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
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        setBlocks(data && data.length > 0 ? data : MOCK_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
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

      return data && data.length > 0
        ? data.map((d: any) => ({
            date: d.date,
            cloud_cover: Number(d.cloud_cover),
            ndvi_mean: Number(d.ndvi_mean),
            ndmi_mean: Number(d.ndmi_mean)
          }))
        : (MOCK_STATS[blockId] || []);
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
