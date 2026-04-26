'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data (polygons) from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initializing client inside effect or conditionally to avoid SSR issues if env vars are missing
  const getSupabase = () => createClient();

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials missing, using mock data for vineyard blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = getSupabase();
        // We use a custom RPC or a view if PostgREST doesn't return GeoJSON directly for geometry columns
        // For this implementation, we assume we might need a specific selection or RPC
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS); // Fallback to mock on error
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return MOCK_STATS[blockId] || [];
    }

    try {
      const supabase = getSupabase();
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
      return MOCK_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}

// --- MOCK DATA FOR LOCAL DEVELOPMENT ---

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    created_at: new Date().toISOString(),
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.512, 51.935],
        [15.515, 51.935],
        [15.515, 51.938],
        [15.512, 51.938],
        [15.512, 51.935]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Slope Riesling',
    area_ha: 1.8,
    created_at: new Date().toISOString(),
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.518, 51.932],
        [15.521, 51.932],
        [15.521, 51.934],
        [15.518, 51.934],
        [15.518, 51.932]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.5 },
    { date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.75, ndmi_mean: 0.65 }
  ],
  'block-2': [
    { date: '2024-01-01', cloud_cover: 5, ndvi_mean: 0.15, ndmi_mean: 0.05 },
    { date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.22, ndmi_mean: 0.12 },
    { date: '2024-03-01', cloud_cover: 10, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.7, ndmi_mean: 0.6 }
  ]
};
