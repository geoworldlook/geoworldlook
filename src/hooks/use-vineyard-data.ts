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
        [15.51, 51.91],
        [15.52, 51.91],
        [15.52, 51.92],
        [15.51, 51.92],
        [15.51, 51.91]
      ]]
    }
  },
  {
    id: '2',
    name: 'South Slope Riesling',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.53, 51.91],
        [15.54, 51.91],
        [15.54, 51.92],
        [15.53, 51.92],
        [15.53, 51.91]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  '1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.3, ndmi_mean: 0.2 },
    { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.75, ndmi_mean: 0.5 },
  ],
  '2': [
    { date: '2024-01-01', cloud_cover: 5, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-02-01', cloud_cover: 15, ndvi_mean: 0.3, ndmi_mean: 0.2 },
    { date: '2024-03-01', cloud_cover: 0, ndvi_mean: 0.4, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 10, ndvi_mean: 0.55, ndmi_mean: 0.4 },
    { date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.7, ndmi_mean: 0.45 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        // Use RPC function to get GeoJSON geometries
        const { data, error } = await supabase
          .rpc('get_vineyard_blocks_geojson');

        if (error) {
          // Fallback to direct select if RPC fails (e.g. not created yet)
          const { data: selectData, error: selectError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (selectError) throw selectError;
          setBlocks(selectData || []);
        } else {
          setBlocks(data || []);
        }
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
