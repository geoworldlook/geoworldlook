'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data to ensure the map shows something if Supabase is not connected
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [7.962, 44.631],
        [7.965, 44.631],
        [7.965, 44.633],
        [7.962, 44.633],
        [7.962, 44.631]
      ]]
    }
  }
];

const MOCK_STATS: VineyardStat[] = [
  { block_id: 'mock-block-1', date: '2024-01-01', ndvi_mean: 0.45, ndmi_mean: 0.21, cloud_cover: 5 },
  { block_id: 'mock-block-1', date: '2024-02-01', ndvi_mean: 0.52, ndmi_mean: 0.25, cloud_cover: 10 },
  { block_id: 'mock-block-1', date: '2024-03-01', ndvi_mean: 0.65, ndmi_mean: 0.35, cloud_cover: 2 },
  { block_id: 'mock-block-1', date: '2024-04-01', ndvi_mean: 0.78, ndmi_mean: 0.42, cloud_cover: 0 },
];

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all blocks for map display (polygons).
 * - Fetches historical NDVI/NDMI stats for a selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Fetch all vineyard blocks
  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_blocks_geojson');

        if (error) {
          console.warn('Vineyard blocks table not found or error:', error);
          setBlocks(MOCK_BLOCKS);
          return;
        }

        setBlocks(data || MOCK_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!isSupabaseConfigured || blockId.startsWith('mock-')) {
      return MOCK_STATS;
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
