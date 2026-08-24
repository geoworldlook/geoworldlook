'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlockGeoJSON, VineyardBlockFeature, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS_GEOJSON, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyards';

export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<VineyardBlockGeoJSON>({
    type: 'FeatureCollection',
    features: []
  });
  const [blocks, setBlocks] = useState<VineyardBlockFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!hasSupabase) {
        setBlocksGeoJSON(MOCK_VINEYARD_BLOCKS_GEOJSON);
        setBlocks(MOCK_VINEYARD_BLOCKS_GEOJSON.features);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error || !data || !data.features || data.features.length === 0) {
          if (error) console.warn('Error or empty result fetching vineyard blocks via RPC:', error.message);
          setBlocksGeoJSON(MOCK_VINEYARD_BLOCKS_GEOJSON);
          setBlocks(MOCK_VINEYARD_BLOCKS_GEOJSON.features);
        } else {
          setBlocksGeoJSON(data);
          setBlocks(data.features);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocksGeoJSON(MOCK_VINEYARD_BLOCKS_GEOJSON);
        setBlocks(MOCK_VINEYARD_BLOCKS_GEOJSON.features);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasSupabase) {
      return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS["vb-zg-01"] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS["vb-zg-01"] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_VINEYARD_STATS[blockId] || MOCK_VINEYARD_STATS["vb-zg-01"] || [];
    }
  }

  return {
    blocksGeoJSON,
    blocks,
    loading,
    error,
    getBlockStats
  };
}
