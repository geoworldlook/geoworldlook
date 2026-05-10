
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.500, 51.930],
          [15.505, 51.930],
          [15.505, 51.935],
          [15.500, 51.935],
          [15.500, 51.930]
        ]]
      },
      properties: {
        id: 'block-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 2.5
      }
    },
    {
      type: 'Feature',
      id: 'block-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.510, 51.932],
          [15.515, 51.932],
          [15.515, 51.937],
          [15.510, 51.937],
          [15.510, 51.932]
        ]]
      },
      properties: {
        id: 'block-2',
        name: 'Chardonnay Valley',
        area_ha: 3.8
      }
    }
  ]
};

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.12 },
    { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.15 },
    { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.25 },
    { block_id: 'block-1', date: '2024-04-01', cloud_cover: 0, ndvi_mean: 0.65, ndmi_mean: 0.40 },
    { block_id: 'block-1', date: '2024-05-01', cloud_cover: 15, ndvi_mean: 0.72, ndmi_mean: 0.45 }
  ],
  'block-2': [
    { block_id: 'block-2', date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.40, ndmi_mean: 0.10 },
    { block_id: 'block-2', date: '2024-02-01', cloud_cover: 8, ndvi_mean: 0.42, ndmi_mean: 0.13 },
    { block_id: 'block-2', date: '2024-03-01', cloud_cover: 25, ndvi_mean: 0.50, ndmi_mean: 0.20 },
    { block_id: 'block-2', date: '2024-04-01', cloud_cover: 5, ndvi_mean: 0.60, ndmi_mean: 0.35 },
    { block_id: 'block-2', date: '2024-05-01', cloud_cover: 10, ndvi_mean: 0.68, ndmi_mean: 0.42 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
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

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
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
