'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks (polygons) for map rendering.
 * - Fetches historical NDVI/NDMI time-series for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        // In a real environment, we would use PostGIS to get GeoJSON:
        // .select('id, name, area_ha, geom')
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
           console.warn('Using mock data for blocks due to Supabase error or missing table:', error.message);
           setBlocks(MOCK_VINEYARD_BLOCKS);
        } else if (data && data.length > 0) {
           setBlocks(data as VineyardBlock[]);
        } else {
           setBlocks(MOCK_VINEYARD_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_VINEYARD_BLOCKS);
        // setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Using mock stats for block ${blockId} due to error:`, error.message);
        return MOCK_VINEYARD_STATS[blockId] || [];
      }

      if (data && data.length > 0) {
        return data as VineyardStat[];
      }

      return MOCK_VINEYARD_STATS[blockId] || [];
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_VINEYARD_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
