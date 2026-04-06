
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [6.1, 46.4],
        [6.2, 46.4],
        [6.2, 46.5],
        [6.1, 46.5],
        [6.1, 46.4]
      ]]
    }
  }
];

const MOCK_STATS: VineyardStat[] = [
  { date: '2024-01-01', ndvi_mean: 0.45, ndmi_mean: 0.2, cloud_cover: 5 },
  { date: '2024-02-01', ndvi_mean: 0.52, ndmi_mean: 0.25, cloud_cover: 10 },
  { date: '2024-03-01', ndvi_mean: 0.65, ndmi_mean: 0.35, cloud_cover: 2 },
];

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks with their GeoJSON geometries.
 * - Fetches historical statistics (NDVI, NDMI) for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Fetch all vineyard blocks (GeoJSON) for the map
  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a GeoJSON FeatureCollection
        const featureCollection = data as any;
        const formattedBlocks: VineyardBlock[] = (featureCollection.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS); // Fallback
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches historical statistics (NDVI, NDMI) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!isSupabaseConfigured || blockId.startsWith('mock-')) {
      return MOCK_STATS;
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
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS; // Fallback
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
