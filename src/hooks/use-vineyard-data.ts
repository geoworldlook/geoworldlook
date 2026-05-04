
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_BLOCKS, MOCK_STATS_MAP } from '@/lib/mock-data/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a stable supabase client or null if env vars are missing
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient() : null;

  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('Supabase not configured, using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) throw error;

        if (data && data.length > 0) {
            setBlocks(data);
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
  }, [supabase]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!supabase) {
        return MOCK_STATS_MAP[blockId] || [];
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
          return (data || []).map((d: any) => ({
            date: d.date,
            ndvi_mean: Number(d.ndvi_mean),
            ndmi_mean: Number(d.ndmi_mean),
            cloud_cover: Number(d.cloud_cover)
          }));
      }

      return MOCK_STATS_MAP[blockId] || [];
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS_MAP[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
