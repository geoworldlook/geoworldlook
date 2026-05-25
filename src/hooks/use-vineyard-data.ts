
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-01',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.52, 51.93],
        [15.54, 51.93],
        [15.54, 51.94],
        [15.52, 51.94],
        [15.52, 51.93]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: VineyardStat[] = Array.from({ length: 12 }).map((_, i) => ({
  block_id: 'block-01',
  date: `2024-${String(i + 1).padStart(2, '0')}-01`,
  cloud_cover: Math.random() * 20,
  ndvi_mean: 0.3 + Math.random() * 0.5,
  ndmi_mean: 0.1 + Math.random() * 0.4
}));

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS); // Fallback
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return MOCK_STATS;
      }

      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS; // Fallback
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
