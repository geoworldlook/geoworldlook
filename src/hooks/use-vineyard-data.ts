
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard';

// Mock data for cases where Supabase is not configured or returning empty data
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-1',
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
    id: 'mock-2',
    name: 'Parcela South Merlot',
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

const MOCK_STATS: VineyardBlockStats[] = [
  { date: '2023-05-10', ndvi_mean: 0.45, ndmi_mean: 0.15, cloud_cover: 10 },
  { date: '2023-06-12', ndvi_mean: 0.62, ndmi_mean: 0.25, cloud_cover: 5 },
  { date: '2023-07-15', ndvi_mean: 0.78, ndmi_mean: 0.35, cloud_cover: 0 },
  { date: '2023-08-20', ndvi_mean: 0.70, ndmi_mean: 0.20, cloud_cover: 15 },
  { date: '2023-09-25', ndvi_mean: 0.55, ndmi_mean: 0.10, cloud_cover: 20 }
];

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks as GeoJSON for map rendering.
 * - Fetches historical statistics (NDVI, NDMI) for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        if (!supabase) throw new Error('Supabase client not initialized');

        // We use the RPC function to get GeoJSON directly
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection
        const features = data?.features || [];

        if (features.length === 0) {
          setBlocks(MOCK_BLOCKS);
        } else {
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry,
            stats: []
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        // Fallback to mock data if Supabase fails
        setBlocks(MOCK_BLOCKS);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardBlockStats[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS;
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
