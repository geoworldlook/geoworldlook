
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: '1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [6.0, 46.5],
        [6.2, 46.5],
        [6.2, 46.7],
        [6.0, 46.7],
        [6.0, 46.5]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: VineyardStat[] = [
  { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
  { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.15, cloud_cover: 20 },
  { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.3, cloud_cover: 5 },
  { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.5, cloud_cover: 0 }
];

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks for map rendering.
 * - Fetches historical stats (NDVI, NDMI) for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey;

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured, using mock blocks');
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS); // Fallback to mock on error
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches the historical stats for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!isSupabaseConfigured) {
        return MOCK_STATS;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS; // Fallback to mock on error
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
