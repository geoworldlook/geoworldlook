
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.525, 51.935],
        [15.530, 51.935],
        [15.530, 51.938],
        [15.525, 51.938],
        [15.525, 51.935]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Chardonnay South Slope',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.535, 51.932],
        [15.540, 51.932],
        [15.540, 51.935],
        [15.535, 51.935],
        [15.535, 51.932]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.12 },
    { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.15 },
    { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.22 },
    { block_id: 'block-1', date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.65, ndmi_mean: 0.35 },
    { block_id: 'block-1', date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.78, ndmi_mean: 0.45 }
  ],
  'block-2': [
    { block_id: 'block-2', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.35, ndmi_mean: 0.05 },
    { block_id: 'block-2', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.38, ndmi_mean: 0.08 },
    { block_id: 'block-2', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.45, ndmi_mean: 0.15 },
    { block_id: 'block-2', date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.55, ndmi_mean: 0.25 },
    { block_id: 'block-2', date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.68, ndmi_mean: 0.35 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      // Check if env vars are present
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        console.warn('Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC get_vineyard_blocks_geojson error, falling back to mock:', error.message);
          setBlocks(MOCK_BLOCKS);
        } else {
          const featureCollection = data as any;
          const formattedBlocks: VineyardBlock[] = featureCollection.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return data.map((d: any) => ({
        block_id: d.block_id,
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
