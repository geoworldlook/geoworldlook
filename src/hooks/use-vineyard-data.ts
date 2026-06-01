'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: '1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.50, 51.90],
        [15.51, 51.90],
        [15.51, 51.91],
        [15.50, 51.91],
        [15.50, 51.90]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Parcela South Riesling',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.52, 51.92],
        [15.53, 51.92],
        [15.53, 51.93],
        [15.52, 51.93],
        [15.52, 51.92]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  '1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.5 },
  ],
  '2': [
    { date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.15, ndmi_mean: 0.05 },
    { date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.22, ndmi_mean: 0.12 },
    { date: '2024-03-01', cloud_cover: 8, ndvi_mean: 0.38, ndmi_mean: 0.28 },
    { date: '2024-04-01', cloud_cover: 18, ndvi_mean: 0.55, ndmi_mean: 0.45 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = hasEnv ? createClient() : null;

  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        // Use RPC to get GeoJSON geometry
        const { data, error } = await supabase
          .rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [supabase]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!supabase) {
      return MOCK_STATS[blockId] || [];
    }

    try {
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
