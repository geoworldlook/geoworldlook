
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.51, 51.93],
        [15.52, 51.93],
        [15.52, 51.94],
        [15.51, 51.94],
        [15.51, 51.93]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Slope Syrah',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.53, 51.92],
        [15.54, 51.92],
        [15.54, 51.93],
        [15.53, 51.93],
        [15.53, 51.92]
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
    { date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.18, ndmi_mean: 0.08 },
    { date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.22, ndmi_mean: 0.12 },
    { date: '2024-03-01', cloud_cover: 8, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 10, ndvi_mean: 0.55, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 2, ndvi_mean: 0.7, ndmi_mean: 0.6 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase fetch failed, using mock data:', error);
          setBlocks(MOCK_BLOCKS);
        } else {
          setBlocks(data || MOCK_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks, using mock data:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Supabase stats fetch failed for ${blockId}, using mock data`);
        return MOCK_STATS[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}, using mock data:`, err);
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
