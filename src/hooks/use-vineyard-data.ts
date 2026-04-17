
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
// Coordinated updated to Zielona Góra region (approx [15.5, 51.9])
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.930],
        [15.545, 51.930],
        [15.545, 51.940],
        [15.530, 51.940],
        [15.530, 51.930]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Parcela Sud Sangiovese',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.550, 51.925],
        [15.565, 51.925],
        [15.565, 51.935],
        [15.550, 51.935],
        [15.550, 51.925]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.22 },
    { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.25 },
    { date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.55, ndmi_mean: 0.30 },
    { date: '2024-04-01', cloud_cover: 20, ndvi_mean: 0.65, ndmi_mean: 0.40 },
    { date: '2024-05-01', cloud_cover: 8, ndvi_mean: 0.75, ndmi_mean: 0.45 },
  ],
  'block-2': [
    { date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.40, ndmi_mean: 0.20 },
    { date: '2024-05-01', cloud_cover: 10, ndvi_mean: 0.70, ndmi_mean: 0.42 },
  ]
};

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn('[useVineyardData] Supabase env vars missing — using mock data');
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

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
   * Fetches historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return MOCK_STATS[blockId] || [];
      }

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
      return MOCK_STATS[blockId] || []; // Fallback to mock on error
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
