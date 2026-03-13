
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo (Mock)',
    area_ha: 2.5,
    geometry: {
      type: 'Polygon',
      coordinates: [[[6.1, 46.4], [6.2, 46.4], [6.2, 46.5], [6.1, 46.5], [6.1, 46.4]]]
    },
    stats: []
  }
];

const MOCK_STATS: VineyardStat[] = [
  { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.6, ndmi_mean: 0.4 },
  { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.65, ndmi_mean: 0.45 },
  { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.7, ndmi_mean: 0.5 },
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: geojsonData, error: rpcError } = await supabase.rpc('get_blocks_geojson');

        if (rpcError) throw rpcError;

        const formattedBlocks: VineyardBlock[] = (geojsonData.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geometry: f.geometry,
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

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return MOCK_STATS;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
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
