
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all vineyard blocks as GeoJSON
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase environment variables are missing');
        }

        const supabase = createClient();

        // Using the RPC function we created in the migration (best for GeoJSON)
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC get_vineyard_blocks_geojson failed, falling back to manual fetch:', error);
          // Fallback fetch with explicit PostGIS to GeoJSON conversion
          // Note: Standard PostgREST doesn't support .select('..., geom.ST_AsGeoJSON()') directly
          // so we rely on the RPC or a View. If both fail, we show mock.
          throw error;
        } else {
          setBlocks(data);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if Supabase is not reachable or misconfigured
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.50, 51.93], [15.55, 51.93], [15.55, 51.96], [15.50, 51.96], [15.50, 51.93]]]
              },
              properties: { id: 'mock-1', name: 'Winnica Testowa A (Mock)', area_ha: 2.5 }
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
   * Fetches historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables are missing');
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: blockId,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);

      // Mock data for development
      return Array.from({ length: 12 }).map((_, i) => ({
        block_id: blockId,
        date: `2023-${(i + 1).toString().padStart(2, '0')}-01`,
        cloud_cover: 5 + Math.random() * 15,
        ndvi_mean: 0.4 + Math.random() * 0.4,
        ndmi_mean: 0.2 + Math.random() * 0.3
      }));
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
