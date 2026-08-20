'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing vineyard polygon blocks and satellite statistics from Supabase.
 * - Fetches blocks with GeoJSON geometries using `get_vineyard_blocks_geojson` RPC function.
 * - Fetches historical satellite stats (NDVI, NDMI, cloud cover) for a selected block.
 * - Falls back gracefully to mock data when Supabase is not configured or queries fail.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase env vars missing, using mock vineyard blocks.");
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const features = data?.features || [];
        if (features.length === 0) {
          console.warn("No vineyard blocks found in Supabase, using mock data.");
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.name || 'Unnamed Block',
            area_ha: f.properties?.area_ha ? Number(f.properties.area_ha) : undefined,
            geom: f.geometry,
            timeSeries: []
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
  }, []);

  /**
   * Fetches historical time-series stats (NDVI, NDMI, cloud cover) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    const mockMatch = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return mockMatch?.timeSeries || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return mockMatch?.timeSeries || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for vineyard block ${blockId}:`, err);
      return mockMatch?.timeSeries || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
