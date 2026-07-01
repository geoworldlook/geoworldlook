'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Zielona Góra - Winnica Testowa 1',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.50, 51.93],
        [15.52, 51.93],
        [15.52, 51.94],
        [15.50, 51.94],
        [15.50, 51.93]
      ]]
    },
    stats: []
  },
  {
    id: 'block-2',
    name: 'Zielona Góra - Winnica Testowa 2',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.53, 51.93],
        [15.55, 51.93],
        [15.55, 51.94],
        [15.53, 51.94],
        [15.53, 51.93]
      ]]
    },
    stats: []
  }
];

const MOCK_STATS: Record<string, VineyardStats[]> = {
  'block-1': [
    { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: -0.1, cloud_cover: 10 },
    { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: -0.05, cloud_cover: 20 },
    { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.1, cloud_cover: 5 },
    { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.3, cloud_cover: 15 },
    { date: '2024-05-01', ndvi_mean: 0.75, ndmi_mean: 0.5, cloud_cover: 0 },
    { date: '2024-06-01', ndvi_mean: 0.8, ndmi_mean: 0.6, cloud_cover: 10 },
  ],
  'block-2': [
    { date: '2024-01-01', ndvi_mean: 0.15, ndmi_mean: -0.2, cloud_cover: 10 },
    { date: '2024-02-01', ndvi_mean: 0.22, ndmi_mean: -0.1, cloud_cover: 20 },
    { date: '2024-03-01', ndvi_mean: 0.35, ndmi_mean: 0.05, cloud_cover: 5 },
    { date: '2024-04-01', ndvi_mean: 0.55, ndmi_mean: 0.25, cloud_cover: 15 },
    { date: '2024-05-01', ndvi_mean: 0.7, ndmi_mean: 0.45, cloud_cover: 0 },
    { date: '2024-06-01', ndvi_mean: 0.78, ndmi_mean: 0.55, cloud_cover: 10 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials missing, using mock data');
      setUseMock(true);
      setBlocks(MOCK_BLOCKS);
      setLoading(false);
      return;
    }

    async function fetchBlocks() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const featureCollection = data as any;
        const formattedBlocks: VineyardBlock[] = featureCollection.features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          stats: []
        }));

        setBlocks(formattedBlocks);
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
    if (useMock) {
      return MOCK_STATS[blockId] || [];
    }

    const supabase = createClient();
    try {
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
