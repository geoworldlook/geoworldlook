
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1, // Changed to number for feature-state
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 4.5
      }
    },
    {
      type: 'Feature',
      id: 2, // Changed to number for feature-state
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.52, 51.93], [15.53, 51.93], [15.53, 51.94], [15.52, 51.94], [15.52, 51.93]]]
      },
      properties: {
        id: 'mock-2',
        name: 'Parcela South Syrah',
        area_ha: 3.2
      }
    }
  ]
};

const MOCK_STATS: VineyardStat[] = [
  { block_id: 'mock-1', date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.20 },
  { block_id: 'mock-1', date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.48, ndmi_mean: 0.22 },
  { block_id: 'mock-1', date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.55, ndmi_mean: 0.30 },
  { block_id: 'mock-2', date: '2024-01-01', cloud_cover: 8, ndvi_mean: 0.40, ndmi_mean: 0.18 },
  { block_id: 'mock-2', date: '2024-02-01', cloud_cover: 12, ndvi_mean: 0.42, ndmi_mean: 0.19 },
  { block_id: 'mock-2', date: '2024-03-01', cloud_cover: 20, ndvi_mean: 0.50, ndmi_mean: 0.25 },
];

export function useVineyardData() {
  const [blocksGeojson, setBlocksGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Check if env vars exist before creating client
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocksGeojson(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase RPC error, using mock data:', error.message);
          setBlocksGeojson(MOCK_BLOCKS);
        } else {
          setBlocksGeojson(data || MOCK_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocksGeojson(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS.filter(s => s.block_id === blockId);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return [];
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
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
    blocksGeojson,
    loading,
    error,
    getBlockStats
  };
}
