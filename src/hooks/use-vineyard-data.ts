'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks for map rendering.
 * - Fetches historical statistics for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a fallback for env vars to avoid crash
  // Moved inside useEffect to prevent crash during SSR/initialization if env vars are missing

  // 1. Fetch all blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
           throw new Error('Supabase environment variables are missing');
        }
        const supabase = createClient();
        // Try to use the RPC function we created in the migration
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC get_vineyard_blocks_geojson failed, falling back to direct table select:', error.message);
          // Fallback if RPC is not yet deployed or fails
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (tableError) throw tableError;

          setBlocks(tableData || []);
        } else {
          // RPC returns a GeoJSON FeatureCollection
          const features = (data as any).features || [];
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if Supabase fails or is empty
        if (process.env.NODE_ENV === 'development') {
          setBlocks([
            {
              id: '1',
              name: 'Mock Block A',
              area_ha: 2.5,
              geom: {
                type: 'Polygon',
                coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
              }
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical statistics for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables are missing');
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
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
    blocks,
    loading,
    error,
    getBlockStats
  };
}
