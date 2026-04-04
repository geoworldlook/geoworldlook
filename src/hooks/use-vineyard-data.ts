
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS, MOCK_STATS_MAP } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks for map rendering.
 * - Fetches historical stats (NDVI, NDMI) for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a safely initialized supabase client
  // If env vars are missing, we'll gracefully handle it
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? createClient()
    : null;

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        if (!data || data.length === 0) {
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          const formattedBlocks: VineyardBlock[] = data.map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geometry: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom
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
  }, [supabase]);

  /**
   * Fetches the historical time series for a specific vineyard block.
   */
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

      if (!data || data.length === 0) {
          return MOCK_STATS_MAP[blockId] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
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
