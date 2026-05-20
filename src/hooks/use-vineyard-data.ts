'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Nebbiolo South',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.50, 51.93],
        [15.51, 51.93],
        [15.51, 51.94],
        [15.50, 51.94],
        [15.50, 51.93]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Chardonnay Hill',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.52, 51.935],
        [15.53, 51.935],
        [15.53, 51.945],
        [15.52, 51.945],
        [15.52, 51.935]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': Array.from({ length: 12 }, (_, i) => ({
    block_id: 'block-1',
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
    cloud_cover: Math.random() * 20,
    ndvi_mean: 0.3 + Math.sin(i / 2) * 0.4 + Math.random() * 0.1,
    ndmi_mean: 0.1 + Math.sin(i / 2) * 0.3 + Math.random() * 0.1
  })),
  'block-2': Array.from({ length: 12 }, (_, i) => ({
    block_id: 'block-2',
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
    cloud_cover: Math.random() * 25,
    ndvi_mean: 0.2 + Math.sin(i / 2) * 0.3 + Math.random() * 0.1,
    ndmi_mean: 0.0 + Math.sin(i / 2) * 0.2 + Math.random() * 0.1
  }))
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase env vars missing — using mock blocks');
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
            const { data: selectData, error: selectError } = await supabase
                .from('vineyard_blocks')
                .select('id, name, area_ha, geom');

            if (selectError) throw selectError;

            setBlocks(selectData.map((b: any) => ({
                id: b.id,
                name: b.name,
                area_ha: Number(b.area_ha),
                geom: b.geom
            })));
        } else {
            const formattedBlocks = (data.features || []).map((f: any) => ({
                id: f.properties.id,
                name: f.properties.name,
                area_ha: Number(f.properties.area_ha),
                geom: f.geometry
            }));
            setBlocks(formattedBlocks);
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
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return MOCK_STATS[blockId] || [];
      }

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
