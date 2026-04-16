
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for local development if Supabase is not configured
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.48, 51.92], [15.52, 51.92], [15.52, 51.95], [15.48, 51.95], [15.48, 51.92]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 12.5
      }
    }
  ]
};

const MOCK_STATS: VineyardStat[] = [
  { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.2, ndmi_mean: 0.1 },
  { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.3, ndmi_mean: 0.2 },
  { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.5, ndmi_mean: 0.4 },
  { date: '2024-04-01', cloud_cover: 15, ndvi_mean: 0.7, ndmi_mean: 0.6 },
];

export function useVineyardData() {
  const [blocksGeojson, setBlocksGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create client only when needed to avoid issues if env vars are missing
  const getSupabase = () => createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase RPC error, falling back to mock data:', error);
          setBlocksGeojson(MOCK_BLOCKS_GEOJSON);
        } else {
          setBlocksGeojson(data);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocksGeojson(MOCK_BLOCKS_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS;
    }

    try {
      const supabase = getSupabase();
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
