
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlockWithStats, VineyardTimeSeries } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks for map polygons.
 * - Fetches historical NDVI/NDMI time-series for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlockWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        // Map database fields to the VineyardBlockWithStats type
        // Note: PostGIS geom is typically returned as GeoJSON if selected correctly
        // via PostGIS functions, but here we assume the direct select is sufficient
        // or handled by Supabase PostgREST
        const formattedBlocks: VineyardBlockWithStats[] = (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          area_ha: b.area_ha,
          geom: b.geom, // Assume GeoJSON or already parsed
          timeSeries: [] // Initialized empty, loaded on selection
        }));

        setBlocks(formattedBlocks);
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
   * Fetches the historical time series for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
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
