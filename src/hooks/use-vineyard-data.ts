
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard GIS data from Supabase.
 * - Fetches all vineyard blocks as GeoJSON features.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnvVars = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const supabase = hasEnvVars ? createClient() : null;

  // 1. Fetch all vineyard blocks (GeoJSON)
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        setBlocks(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if table doesn't exist yet
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              properties: { id: 'mock-1', name: 'Parcela Nord Nebbiolo', area_ha: 2.5 },
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.50, 51.90], [15.51, 51.90], [15.51, 51.91], [15.50, 51.91], [15.50, 51.90]]]
              }
            }
          ]
        });
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
    try {
      if (!supabase) throw new Error('Supabase client not initialized');

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

      // Mock stats for development
      return [
        { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
        { date: '2024-02-01', ndvi_mean: 0.3, ndmi_mean: 0.15, cloud_cover: 5 },
        { date: '2024-03-01', ndvi_mean: 0.5, ndmi_mean: 0.3, cloud_cover: 20 },
        { date: '2024-04-01', ndvi_mean: 0.7, ndmi_mean: 0.5, cloud_cover: 0 },
      ];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
