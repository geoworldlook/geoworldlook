'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat, VineyardGeoJSON } from '@/types/vineyard';
import { MOCK_GEOJSON, MOCK_STATS_MAP } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches blocks as GeoJSON for the map.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<VineyardGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks as GeoJSON
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_blocks_geojson');

        if (error) {
          console.warn('Using mock data due to error fetching blocks:', error);
          setBlocksGeoJSON(MOCK_GEOJSON);
        } else {
          setBlocksGeoJSON(data as VineyardGeoJSON);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocksGeoJSON(MOCK_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the 12-month time series for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Using mock stats for block ${blockId} due to error:`, error);
        return MOCK_STATS_MAP[blockId] || [];
      }

      return (data || []).map((d: any) => ({
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
    blocksGeoJSON,
    loading,
    error,
    getBlockStats
  };
}
