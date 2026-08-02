'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing vineyard block GIS data from Supabase.
 * - Fetches all vineyard blocks as GeoJSON using database RPC.
 * - Fetches historical NDVI and NDMI time-series for a specific selected block.
 * - Gracefully falls back to mock data if environment variables are missing.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase environment variables are configured
  const hasSupabase =
    typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasSupabase) {
        console.warn('[GeoWorldLook] Supabase credentials missing. Falling back to mock vineyard data.');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        // Deferred instantiation of the Supabase client inside the fetch logic
        const supabase = createClient();

        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        // Parse features from the returned GeoJSON FeatureCollection
        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties?.id || f.id,
          name: f.properties?.name || 'Unknown Block',
          area_ha: f.properties?.area_ha ? Number(f.properties.area_ha) : 0,
          geom: f.geometry,
          stats: [] // To be loaded on demand or empty initially
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks from Supabase:', err);
        setError(err.message);
        // Resilient fallback to mock data on DB error
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasSupabase]);

  /**
   * Fetches historical satellite statistics (NDVI, NDMI, cloud cover) for a block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!hasSupabase) {
      const mockBlock = MOCK_VINEYARD_BLOCKS.find((b) => b.id === blockId);
      return mockBlock?.stats || [];
    }

    try {
      const supabase = createClient();
      const { data, error: statsError } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (statsError) throw statsError;

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      // Fallback stats from mock data
      const mockBlock = MOCK_VINEYARD_BLOCKS.find((b) => b.id === blockId);
      return mockBlock?.stats || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
