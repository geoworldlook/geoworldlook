
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Mock data for fallback
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: '1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.940],
        [15.535, 51.940],
        [15.535, 51.945],
        [15.530, 51.945],
        [15.530, 51.940]
      ]]
    },
    stats: []
  },
  {
    id: '2',
    name: 'South Slope Chardonnay',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.540, 51.935],
        [15.545, 51.935],
        [15.545, 51.940],
        [15.540, 51.940],
        [15.540, 51.935]
      ]]
    },
    stats: []
  }
];

const MOCK_STATS: Record<string, VineyardStats[]> = {
  '1': [
    { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.15 },
    { date: '2024-02-01', cloud_cover: 25, ndvi_mean: 0.25, ndmi_mean: 0.18 },
    { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.4, ndmi_mean: 0.3 },
    { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.45 },
    { date: '2024-05-01', cloud_cover: 0, ndvi_mean: 0.75, ndmi_mean: 0.55 }
  ],
  '2': [
    { date: '2024-01-01', cloud_cover: 12, ndvi_mean: 0.18, ndmi_mean: 0.12 },
    { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.22, ndmi_mean: 0.16 },
    { date: '2024-03-01', cloud_cover: 8, ndvi_mean: 0.35, ndmi_mean: 0.28 },
    { date: '2024-04-01', cloud_cover: 10, ndvi_mean: 0.55, ndmi_mean: 0.42 },
    { date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.7, ndmi_mean: 0.52 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to check if Supabase is configured
  const isSupabaseConfigured = () => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  };

  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Using mock data due to Supabase error:', error);
          setBlocks(MOCK_BLOCKS);
        } else {
          const featureCollection = data as any;
          const formattedBlocks: VineyardBlock[] = featureCollection.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry,
            stats: []
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.warn('Using mock data due to catch error:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!isSupabaseConfigured()) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn(`Using mock stats for block ${blockId} due to error:`, error);
        return MOCK_STATS[blockId] || [];
      }

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.warn(`Using mock stats for block ${blockId} due to catch:`, err);
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
