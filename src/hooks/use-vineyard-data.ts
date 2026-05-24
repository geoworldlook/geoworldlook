
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
        [15.520, 51.940],
        [15.525, 51.940],
        [15.525, 51.945],
        [15.520, 51.945],
        [15.520, 51.940]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Slope Chardonnay',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.935],
        [15.535, 51.935],
        [15.535, 51.940],
        [15.530, 51.940],
        [15.530, 51.935]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.32 },
    { block_id: 'block-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.35 },
    { block_id: 'block-1', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.55, ndmi_mean: 0.40 },
    { block_id: 'block-1', date: '2024-04-01', cloud_cover: 0, ndvi_mean: 0.65, ndmi_mean: 0.45 }
  ],
  'block-2': [
    { block_id: 'block-2', date: '2024-01-01', cloud_cover: 15, ndvi_mean: 0.40, ndmi_mean: 0.30 },
    { block_id: 'block-2', date: '2024-02-01', cloud_cover: 8, ndvi_mean: 0.42, ndmi_mean: 0.33 },
    { block_id: 'block-2', date: '2024-03-01', cloud_cover: 12, ndvi_mean: 0.50, ndmi_mean: 0.38 },
    { block_id: 'block-2', date: '2024-04-01', cloud_cover: 2, ndvi_mean: 0.60, ndmi_mean: 0.42 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>(MOCK_BLOCKS);
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

        // Use RPC to get GeoJSON geometries correctly from PostGIS
        const { data: geojson, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase error, using mock data:', error.message);
          setBlocks(MOCK_BLOCKS);
        } else if (geojson && geojson.features) {
          const formattedBlocks: VineyardBlock[] = geojson.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        } else {
          setBlocks(MOCK_BLOCKS);
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

      if (error) {
        console.warn('Supabase error fetching stats, using mock data:', error.message);
        return MOCK_STATS[blockId] || [];
      }

      if (data && data.length > 0) {
        return data as VineyardStat[];
      }

      return MOCK_STATS[blockId] || [];
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
