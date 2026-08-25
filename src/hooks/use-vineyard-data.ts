'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlockFeature, VineyardStats } from '@/types/vineyard';
import { MOCK_VINEYARD_GEOJSON, generateMockTimeSeries } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing GIS vineyard block polygon data from Supabase.
 * - Fetches all active vineyard blocks via RPC as GeoJSON.
 * - Fetches historical NDVI/NDMI time-series for a specific selected block.
 * - Falls back seamlessly to mock data when Supabase configuration is missing.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlockFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setBlocks(MOCK_VINEYARD_GEOJSON.features);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const features = data?.features || [];
        if (features.length === 0) {
          setBlocks(MOCK_VINEYARD_GEOJSON.features);
        } else {
          setBlocks(features);
        }
      } catch (err: any) {
        console.warn('[GeoWorldLook] Error fetching vineyard blocks from Supabase, using mock fallback:', err);
        setError(err.message || 'Failed to fetch vineyard blocks');
        setBlocks(MOCK_VINEYARD_GEOJSON.features);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  /**
   * Fetches historical time series (NDVI & NDMI) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return generateMockTimeSeries();
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
        return generateMockTimeSeries();
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`[GeoWorldLook] Error fetching stats for block ${blockId}, returning mock series:`, err);
      return generateMockTimeSeries();
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
