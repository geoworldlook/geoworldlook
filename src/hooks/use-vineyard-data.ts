
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_BLOCKS, MOCK_STATS_MAP } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all blocks as GeoJSON for the map.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create client only inside functions/useEffect to avoid SSR issues if env vars are missing
  const getSupabase = () => createClient();

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase error, falling back to mock data:', error);
          setBlocks(MOCK_BLOCKS);
          return;
        }

        const features = data.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geometry: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks, using mock data:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical stats for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Supabase error for block ${blockId}, falling back to mock stats`);
        return MOCK_STATS_MAP[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}, using mock data:`, err);
      return MOCK_STATS_MAP[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
