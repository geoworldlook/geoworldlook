'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats, VineyardBlockGeoJSON } from '@/types/vineyard';

// Mock data for fallback and local development
const MOCK_BLOCKS_GEOJSON: VineyardBlockGeoJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.501, 51.935],
          [15.505, 51.935],
          [15.505, 51.938],
          [15.501, 51.938],
          [15.501, 51.935]
        ]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 1.5
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.510, 51.930],
          [15.515, 51.930],
          [15.515, 51.933],
          [15.510, 51.933],
          [15.510, 51.930]
        ]]
      },
      properties: {
        id: 'mock-2',
        name: 'Chardonnay South View',
        area_ha: 2.1
      }
    }
  ]
};

const MOCK_STATS: Record<string, VineyardStats[]> = {
  'mock-1': [
    { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: -0.1, cloud_cover: 5 },
    { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.0, cloud_cover: 10 },
    { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.2, cloud_cover: 15 },
    { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.4, cloud_cover: 2 },
    { date: '2024-05-01', ndvi_mean: 0.75, ndmi_mean: 0.5, cloud_cover: 8 },
  ],
  'mock-2': [
    { date: '2024-01-01', ndvi_mean: 0.15, ndmi_mean: -0.2, cloud_cover: 5 },
    { date: '2024-02-01', ndvi_mean: 0.22, ndmi_mean: -0.1, cloud_cover: 10 },
    { date: '2024-03-01', ndvi_mean: 0.35, ndmi_mean: 0.1, cloud_cover: 15 },
    { date: '2024-04-01', ndvi_mean: 0.55, ndmi_mean: 0.3, cloud_cover: 2 },
    { date: '2024-05-01', ndvi_mean: 0.7, ndmi_mean: 0.45, cloud_cover: 8 },
  ]
};

export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<VineyardBlockGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials missing, using mock data');
        setBlocksGeoJSON(MOCK_BLOCKS_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        if (data && data.features && data.features.length > 0) {
          setBlocksGeoJSON(data as VineyardBlockGeoJSON);
        } else {
          setBlocksGeoJSON(MOCK_BLOCKS_GEOJSON);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocksGeoJSON(MOCK_BLOCKS_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS[blockId] || [];
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return [];
    }

    try {
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
      return [];
    }
  }

  return {
    blocksGeoJSON,
    loading,
    error,
    getBlockStats
  };
}
