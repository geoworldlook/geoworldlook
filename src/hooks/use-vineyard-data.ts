
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not connected
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [7.42, 44.62],
        [7.43, 44.62],
        [7.43, 44.63],
        [7.42, 44.63],
        [7.42, 44.62]
      ]]
    }
  }
];

const MOCK_STATS: VineyardStat[] = [
  { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.12 },
  { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.15 },
  { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.20 }
];

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks with their polygon geometries.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Fetch all vineyard blocks
  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!isSupabaseConfigured) {
      return MOCK_STATS.filter(s => s.block_id === blockId);
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS.filter(s => s.block_id === blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
