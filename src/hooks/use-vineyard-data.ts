
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for local development when Supabase is not configured
const MOCK_BLOCKS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.501, 51.931], [15.505, 51.931], [15.505, 51.935], [15.501, 51.935], [15.501, 51.931]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 2.5
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.506, 51.936], [15.510, 51.936], [15.510, 51.940], [15.506, 51.940], [15.506, 51.936]]]
      },
      properties: {
        id: 'mock-2',
        name: 'Sud Syrah Sector',
        area_ha: 1.8
      }
    }
  ]
};

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'mock-1': [
    { date: '2024-01-01', ndvi_mean: 0.45, ndmi_mean: 0.30, cloud_cover: 10 },
    { date: '2024-02-01', ndvi_mean: 0.48, ndmi_mean: 0.32, cloud_cover: 5 },
    { date: '2024-03-01', ndvi_mean: 0.55, ndmi_mean: 0.35, cloud_cover: 15 },
    { date: '2024-04-01', ndvi_mean: 0.65, ndmi_mean: 0.40, cloud_cover: 0 },
  ],
  'mock-2': [
    { date: '2024-01-01', ndvi_mean: 0.40, ndmi_mean: 0.25, cloud_cover: 10 },
    { date: '2024-02-01', ndvi_mean: 0.42, ndmi_mean: 0.28, cloud_cover: 5 },
    { date: '2024-03-01', ndvi_mean: 0.50, ndmi_mean: 0.30, cloud_cover: 15 },
    { date: '2024-04-01', ndvi_mean: 0.60, ndmi_mean: 0.38, cloud_cover: 0 },
  ]
};

export function useVineyardData() {
  const [blocksGeoJson, setBlocksGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn('Supabase URL missing, using mock data');
          setBlocksGeoJson(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;
        setBlocksGeoJson(data || { type: 'FeatureCollection', features: [] });
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocksGeoJson(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || blockId.startsWith('mock-')) {
        return MOCK_STATS[blockId] || [];
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return [];
    }
  }

  return {
    blocksGeoJson,
    loading,
    error,
    getBlockStats
  };
}
