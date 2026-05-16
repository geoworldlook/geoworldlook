'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches blocks with their GeoJSON geometries.
 * - Fetches historical NDVI/NDMI stats for specific blocks.
 */
export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all blocks as GeoJSON for the map
  useEffect(() => {
    async function fetchBlocks() {
      const supabase = createClient();
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('Supabase env vars missing — using mock vineyard data');
        setBlocksGeoJSON(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // data is already a GeoJSON FeatureCollection from the RPC
        setBlocksGeoJSON(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        // Fallback to mock data if error (e.g. table doesn't exist yet)
        setBlocksGeoJSON(MOCK_BLOCKS);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return MOCK_STATS[blockId as keyof typeof MOCK_STATS] || [];
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
      return MOCK_STATS[blockId as keyof typeof MOCK_STATS] || [];
    }
  }

const MOCK_BLOCKS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-block-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.510, 51.930],
          [15.515, 51.930],
          [15.515, 51.935],
          [15.510, 51.935],
          [15.510, 51.930]
        ]]
      },
      properties: {
        id: 'mock-block-1',
        name: 'Hillside Pinot Noir',
        area_ha: 2.5
      }
    },
    {
      type: 'Feature',
      id: 'mock-block-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.520, 51.932],
          [15.528, 51.932],
          [15.528, 51.938],
          [15.520, 51.938],
          [15.520, 51.932]
        ]]
      },
      properties: {
        id: 'mock-block-2',
        name: 'Valley Chardonnay',
        area_ha: 4.1
      }
    }
  ]
};

const MOCK_STATS = {
  'mock-block-1': [
    { date: '2025-01-01', ndvi_mean: 0.25, ndmi_mean: 0.1, cloud_cover: 5 },
    { date: '2025-02-01', ndvi_mean: 0.28, ndmi_mean: 0.15, cloud_cover: 12 },
    { date: '2025-03-01', ndvi_mean: 0.45, ndmi_mean: 0.3, cloud_cover: 8 },
    { date: '2025-04-01', ndvi_mean: 0.65, ndmi_mean: 0.45, cloud_cover: 2 },
    { date: '2025-05-01', ndvi_mean: 0.82, ndmi_mean: 0.55, cloud_cover: 0 }
  ],
  'mock-block-2': [
    { date: '2025-01-01', ndvi_mean: 0.22, ndmi_mean: 0.05, cloud_cover: 10 },
    { date: '2025-02-01', ndvi_mean: 0.24, ndmi_mean: 0.1, cloud_cover: 15 },
    { date: '2025-03-01', ndvi_mean: 0.40, ndmi_mean: 0.25, cloud_cover: 5 },
    { date: '2025-04-01', ndvi_mean: 0.58, ndmi_mean: 0.4, cloud_cover: 1 },
    { date: '2025-05-01', ndvi_mean: 0.75, ndmi_mean: 0.5, cloud_cover: 0 }
  ]
};

  return {
    blocksGeoJSON,
    loading,
    error,
    getBlockStats
  };
}
