
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
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Parcela Sekt Riesling',
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
  'block-1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.25, ndmi_mean: 0.15 },
    { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.5 },
  ],
  'block-2': [
    { date: '2024-01-01', cloud_cover: 5, ndvi_mean: 0.15, ndmi_mean: 0.05 },
    { date: '2024-02-01', cloud_cover: 30, ndvi_mean: 0.2, ndmi_mean: 0.1 },
    { date: '2024-03-01', cloud_cover: 10, ndvi_mean: 0.35, ndmi_mean: 0.25 },
    { date: '2024-04-01', cloud_cover: 0, ndvi_mean: 0.55, ndmi_mean: 0.45 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a safe client creator that handles missing env vars
  const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? createClient()
    : null;

  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('Supabase not configured, using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // data is a FeatureCollection
        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
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
  }, [supabase]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!supabase) {
      return MOCK_STATS[blockId] || [];
    }

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
