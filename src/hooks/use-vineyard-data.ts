
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks as GeoJSON for the map
  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Mock data for development
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
              },
              properties: { id: 'mock-1', name: 'Mock Vineyard Block', area_ha: 5.2 }
            }
          ]
        });
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        setBlocks(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical stats for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Return mock stats
      return [
        { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
        { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.15, cloud_cover: 20 },
        { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.3, cloud_cover: 5 },
        { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.5, cloud_cover: 15 },
        { date: '2024-05-01', ndvi_mean: 0.7, ndmi_mean: 0.6, cloud_cover: 0 }
      ];
    }

    try {
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
    blocks,
    loading,
    error,
    getBlockStats
  };
}
