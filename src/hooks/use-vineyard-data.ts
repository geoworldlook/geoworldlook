'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries, VineyardGeoJSON } from '@/types/vineyard';
import { MOCK_VINEYARD_GEOJSON, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyards';

export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<VineyardGeoJSON>(MOCK_VINEYARD_GEOJSON);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials missing. Using mock vineyard block data.');
        setBlocksGeoJSON(MOCK_VINEYARD_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error || !data || !data.features || data.features.length === 0) {
          if (error) console.warn('Error fetching vineyard blocks RPC, using mock data:', error.message);
          setBlocksGeoJSON(MOCK_VINEYARD_GEOJSON);
        } else {
          setBlocksGeoJSON(data as VineyardGeoJSON);
        }
      } catch (err: any) {
        console.warn('Exception during vineyard block fetch, using mock data:', err?.message || err);
        setBlocksGeoJSON(MOCK_VINEYARD_GEOJSON);
        setError(err?.message || 'Failed to fetch vineyard blocks');
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS['block-1-zielona-gora'] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) console.warn(`Error fetching stats for block ${blockId}, fallback to mock stats:`, error.message);
        return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS['block-1-zielona-gora'] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`Exception fetching stats for block ${blockId}:`, err);
      return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS['block-1-zielona-gora'] || [];
    }
  }

  return {
    blocksGeoJSON,
    loading,
    error,
    getBlockStats
  };
}
