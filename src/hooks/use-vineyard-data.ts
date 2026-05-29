
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for local development or when Supabase is not configured
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'b1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'b2',
    name: 'Sektor Południowy Riesling',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.910],
        [15.515, 51.910],
        [15.515, 51.915],
        [15.510, 51.915],
        [15.510, 51.910]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'b1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.5 },
    { date: '2024-05-01', cloud_cover: 2, ndvi_mean: 0.8, ndmi_mean: 0.7 }
  ],
  'b2': [
    { date: '2024-01-01', cloud_cover: 8, ndvi_mean: 0.15, ndmi_mean: 0.05 },
    { date: '2024-02-01', cloud_cover: 12, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-03-01', cloud_cover: 18, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 10, ndvi_mean: 0.55, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.75, ndmi_mean: 0.65 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        // In a real scenario, we might use a stored procedure to get GeoJSON directly:
        // const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) {
           console.warn('Supabase error fetching blocks, using mock data:', error.message);
           setBlocks(MOCK_BLOCKS);
           return;
        }

        if (!data || data.length === 0) {
          setBlocks(MOCK_BLOCKS);
          return;
        }

        setBlocks(data as VineyardBlock[]);
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
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Supabase error fetching stats for ${blockId}, using mock data:`, error.message);
        return MOCK_STATS[blockId] || [];
      }

      if (!data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return data as VineyardStat[];
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
