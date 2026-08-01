'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing GIS vineyard block data from Supabase.
 * - Fetches all vineyard blocks as GeoJSON using RPC or falls back to mock data.
 * - Fetches historical NDVI/NDMI time-series for a specific selected vineyard block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Defer creating Supabase client to avoid issues if env variables are missing or not in a browser env.
  const hasSupabase = typeof window !== 'undefined' &&
                     !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
                     !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Fetch all vineyard blocks
  useEffect(() => {
    async function fetchBlocks() {
      if (!hasSupabase) {
        console.warn('[GeoWorldLook] Supabase credentials missing. Falling back to mock vineyard blocks.');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        // We call the custom RPC function that returns GeoJSON feature collection
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection GeoJSON object. We extract the blocks from the features.
        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_VINEYARD_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data in case of error
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasSupabase]);

  /**
   * Fetches the historical stats (time series) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    // If it's a mock block, return mock time series
    if (blockId.startsWith('block-pl-')) {
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock?.timeSeries || [];
    }

    if (!hasSupabase) {
      return [];
    }

    try {
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
      console.error(`Error fetching stats for vineyard block ${blockId}:`, err);
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
