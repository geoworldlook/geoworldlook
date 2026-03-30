
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_BLOCKS, MOCK_STATS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks with their polygon geometries.
 * - Fetches historical NDVI and NDMI time-series for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
          console.warn('Supabase fetch failed, using mock data:', error);
          setBlocks(MOCK_BLOCKS);
        } else {
          setBlocks(data || []);
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

  /**
   * Fetches the historical stats (NDVI, NDMI) for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Supabase stats fetch failed for ${blockId}, using mock data`);
        return MOCK_STATS[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`Error fetching stats for block ${blockId}, using mock data:`, err);
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
