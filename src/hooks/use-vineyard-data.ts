'use client';

import { useState, useEffect } from 'react';
import { MOCK_VINEYARD_BLOCKS, generateMockStats, VineyardBlock, VineyardStat } from '@/lib/mock-data/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Defer client checking/initialization inside fetch functions to prevent SSR and missing-env crashes
      const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!hasEnv) {
        console.warn('[GeoWorldLook] Missing Supabase env variables, falling back to mock vineyard data');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Call the RPC function to get the FeatureCollection
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a GeoJSON FeatureCollection. Let's map it to VineyardBlock interface.
        const features = data?.features || [];
        const fetchedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties?.id || f.id,
          name: f.properties?.name || 'Unknown Block',
          area_ha: Number(f.properties?.area_ha || 0),
          geom: f.geometry
        }));

        setBlocks(fetchedBlocks.length > 0 ? fetchedBlocks : MOCK_VINEYARD_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks from Supabase:', err);
        setError(err.message);
        // Fallback to mock data in case of error
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasEnv) {
      return generateMockStats(blockId);
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      // Fallback to mock data on error
      return generateMockStats(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
