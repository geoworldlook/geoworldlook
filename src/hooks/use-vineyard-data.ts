
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyards';

const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.500, 51.930],
          [15.510, 51.930],
          [15.510, 51.935],
          [15.500, 51.935],
          [15.500, 51.930]
        ]]
      },
      properties: {
        id: 'mock-1',
        name: 'Winnica Centralna - Parcela A',
        area_ha: 1.2
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.520, 51.940],
          [15.530, 51.940],
          [15.530, 51.945],
          [15.520, 51.945],
          [15.520, 51.940]
        ]]
      },
      properties: {
        id: 'mock-2',
        name: 'Winnica Wschodnia - Parcela B',
        area_ha: 2.5
      }
    }
  ]
};

const MOCK_STATS: Record<string, VineyardStats[]> = {
  'mock-1': [
    { block_id: 'mock-1', date: '2024-01-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.22 },
    { block_id: 'mock-1', date: '2024-02-01', cloud_cover: 12, ndvi_mean: 0.48, ndmi_mean: 0.25 },
    { block_id: 'mock-1', date: '2024-03-01', cloud_cover: 2, ndvi_mean: 0.55, ndmi_mean: 0.30 },
    { block_id: 'mock-1', date: '2024-04-01', cloud_cover: 0, ndvi_mean: 0.65, ndmi_mean: 0.45 },
  ],
  'mock-2': [
    { block_id: 'mock-2', date: '2024-01-01', cloud_cover: 8, ndvi_mean: 0.40, ndmi_mean: 0.18 },
    { block_id: 'mock-2', date: '2024-02-01', cloud_cover: 15, ndvi_mean: 0.42, ndmi_mean: 0.20 },
    { block_id: 'mock-2', date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.50, ndmi_mean: 0.28 },
    { block_id: 'mock-2', date: '2024-04-01', cloud_cover: 1, ndvi_mean: 0.60, ndmi_mean: 0.40 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing - using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;
        setBlocks(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return MOCK_STATS[blockId] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
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
