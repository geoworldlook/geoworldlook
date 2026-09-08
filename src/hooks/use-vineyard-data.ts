'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlockGeoJSONCollection, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_GEOJSON, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyards';

/**
 * Custom hook for managing GIS vineyard polygon data from Supabase.
 * - Fetches vineyard blocks as GeoJSON FeatureCollection.
 * - Fetches historical satellite stats (NDVI, NDMI, Cloud cover) for a selected block.
 * - Falls back seamlessly to local mock data if Supabase credentials are not set.
 */
export function useVineyardData() {
  const [blocksData, setBlocksData] = useState<VineyardBlockGeoJSONCollection>({
    type: 'FeatureCollection',
    features: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      const hasSupabaseEnv =
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!hasSupabaseEnv) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard polygon data');
        setBlocksData(MOCK_VINEYARD_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        if (data && data.features && data.features.length > 0) {
          setBlocksData(data as VineyardBlockGeoJSONCollection);
        } else {
          // Fallback to mock data if table is empty
          setBlocksData(MOCK_VINEYARD_GEOJSON);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks GeoJSON:', err);
        setError(err.message || 'Error loading vineyard blocks');
        setBlocksData(MOCK_VINEYARD_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  /**
   * Fetches the historical stats (NDVI, NDMI, Cloud Cover) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const hasSupabaseEnv =
      !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasSupabaseEnv) {
      return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS['block-1-nebbiolo'] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_VINEYARD_STATS[blockId] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_VINEYARD_STATS[blockId] || [];
    }
  }

  return {
    blocksData,
    loading,
    error,
    getBlockStats
  };
}
