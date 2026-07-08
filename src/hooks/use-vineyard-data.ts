
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Zielona Góra - Parcela A',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.930],
        [15.505, 51.930],
        [15.505, 51.935],
        [15.500, 51.935],
        [15.500, 51.930]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Zielona Góra - Parcela B',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.930],
        [15.515, 51.930],
        [15.515, 51.935],
        [15.510, 51.935],
        [15.510, 51.930]
      ]]
    }
  }
];

function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    stats.push({
      date: d.toISOString().split('T')[0],
      cloud_cover: Math.random() * 10,
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: 0.1 + Math.random() * 0.4
    });
  }
  return stats;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection
        const blocksData: VineyardBlock[] = data.features.map((f: any) => ({
          id: f.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));

        setBlocks(blocksData);
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
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return generateMockStats(blockId);
      }

      const supabase = createClient();
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
      return generateMockStats(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
