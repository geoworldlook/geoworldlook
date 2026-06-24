
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';
import { MOCK_BLOCKS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all blocks as GeoJSON for map rendering.
 * - Fetches historical NDVI/NDMI time-series for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
           throw new Error("Supabase environment variables missing");
        }

        // We use the RPC function to get the full GeoJSON FeatureCollection
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection. We map features to VineyardBlock objects.
        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          timeSeries: [] // Initialized empty, loaded on selection
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.warn('[GeoWorldLook] Supabase fetch failed, using mock data:', err.message);
        setBlocks(MOCK_BLOCKS);
        // We don't set error here to allow the app to function with mock data
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the 12-month time series for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    try {
      const supabase = createClient();
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
         throw new Error("Supabase environment variables missing");
      }

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
      console.warn(`[GeoWorldLook] Error fetching stats for block ${blockId}, using mock data:`, err.message);
      const mockBlock = MOCK_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : MOCK_BLOCKS[0].timeSeries;
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
