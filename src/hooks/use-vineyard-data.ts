'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for fallback
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.930],
        [15.525, 51.930],
        [15.525, 51.935],
        [15.520, 51.935],
        [15.520, 51.930]
      ]]
    },
    stats: []
  },
  {
    id: 'mock-2',
    name: 'South Slope Riesling',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.925],
        [15.535, 51.925],
        [15.535, 51.928],
        [15.530, 51.928],
        [15.530, 51.925]
      ]]
    },
    stats: []
  }
];

const MOCK_STATS: VineyardStat[] = [
  { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
  { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.15, cloud_cover: 20 },
  { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.3, cloud_cover: 5 },
  { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.5, cloud_cover: 0 },
  { date: '2024-05-01', ndvi_mean: 0.75, ndmi_mean: 0.65, cloud_cover: 10 },
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn('Supabase not configured, using mock vineyard data');
          setBlocks(MOCK_BLOCKS);
          return;
        }

        const supabase = createClient();
        // We use the RPC function we created in the migration
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          stats: []
        }));

        setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_BLOCKS);
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
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || blockId.startsWith('mock-')) {
        return MOCK_STATS;
      }

      const supabase = createClient();
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
      return MOCK_STATS;
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
