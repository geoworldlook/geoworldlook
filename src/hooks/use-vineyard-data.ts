
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard data from Supabase.
 */
export function useVineyardData() {
  const [blocksGeojson, setBlocksGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all vineyard blocks as GeoJSON
  useEffect(() => {
    // Only create client if env vars are present to avoid crash in environments without them
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials missing, using mock data');
      setBlocksGeojson({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[15.52, 51.93], [15.54, 51.93], [15.54, 51.95], [15.52, 51.95], [15.52, 51.93]]]
            },
            properties: {
              id: 'mock-1',
              name: 'Mock Vineyard Block A',
              area_ha: 2.5
            }
          }
        ]
      });
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;
        setBlocksGeojson(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Fallback mock data if RPC fails
        setBlocksGeojson({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.52, 51.93], [15.54, 51.93], [15.54, 51.95], [15.52, 51.95], [15.52, 51.93]]]
              },
              properties: {
                id: 'mock-1',
                name: 'Mock Vineyard Block A',
                area_ha: 2.5
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
       return Array.from({ length: 12 }).map((_, i) => ({
        block_id: blockId,
        date: `2024-${String(i + 1).padStart(2, '0')}-01`,
        ndvi_mean: 0.3 + Math.random() * 0.4,
        ndmi_mean: 0.1 + Math.random() * 0.3,
        cloud_cover: Math.random() * 20
      }));
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);

      // Return mock data if fetch fails
      return Array.from({ length: 12 }).map((_, i) => ({
        block_id: blockId,
        date: `2024-${String(i + 1).padStart(2, '0')}-01`,
        ndvi_mean: 0.3 + Math.random() * 0.4,
        ndmi_mean: 0.1 + Math.random() * 0.3,
        cloud_cover: Math.random() * 20
      }));
    }
  }

  return {
    blocksGeojson,
    loading,
    error,
    getBlockStats
  };
}
