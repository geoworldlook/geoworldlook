'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks as GeoJSON for the map.
 * - Fetches historical statistics (NDVI/NDMI) for specific blocks.
 */
export function useVineyardData() {
  const [blocksGeoJson, setBlocksGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a stable reference for supabase client to avoid re-creations
  const [supabase] = useState(() => {
    // Only call createClient if the environment variables are available
    if (typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return createClient();
    }
    return null;
  });

  // Mock data for local development when Supabase is not configured
  const MOCK_BLOCKS_GEOJSON = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'mock-1',
        properties: { id: 'mock-1', name: 'Parcela Nord Nebbiolo', area_ha: 2.5 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [15.500, 51.900],
            [15.505, 51.900],
            [15.505, 51.905],
            [15.500, 51.905],
            [15.500, 51.900]
          ]]
        }
      },
      {
        type: 'Feature',
        id: 'mock-2',
        properties: { id: 'mock-2', name: 'South Slope Chardonnay', area_ha: 1.8 },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [15.510, 51.910],
            [15.515, 51.910],
            [15.515, 51.915],
            [15.510, 51.915],
            [15.510, 51.910]
          ]]
        }
      }
    ]
  };

  const getMockStats = (blockId: string): VineyardStat[] => {
    const stats: VineyardStat[] = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      stats.push({
        date: date.toISOString().split('T')[0],
        cloud_cover: Math.random() * 20,
        ndvi_mean: 0.4 + Math.random() * 0.4,
        ndmi_mean: 0.1 + Math.random() * 0.3
      });
    }
    return stats;
  };

  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('[useVineyardData] Supabase not configured, using mock data');
        setBlocksGeoJson(MOCK_BLOCKS_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        setBlocksGeoJson(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data on error
        setBlocksGeoJson(MOCK_BLOCKS_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [supabase]);

  /**
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!supabase || blockId.startsWith('mock-')) {
      return getMockStats(blockId);
    }

    try {
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
    blocksGeoJson,
    loading,
    error,
    getBlockStats
  };
}
