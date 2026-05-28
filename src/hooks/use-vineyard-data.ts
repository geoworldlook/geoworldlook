'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks with their GeoJSON geometries.
 * - Fetches historical NDVI/NDMI stats for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks (polygons)
  useEffect(() => {
    async function fetchBlocks() {
      try {
        // Use RPC to get GeoJSON geometries directly
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          // Fallback if RPC doesn't exist yet (for local development/testing)
          console.warn('RPC get_vineyard_blocks_geojson not found, trying direct select');
          const { data: directData, error: directError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha');

          if (directError) throw directError;

          // If we reach here, we have blocks but no geometries via RPC
          setBlocks((directData || []).map(b => ({ ...b, geom: null })));
        } else {
          setBlocks(data || []);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if Supabase is not configured
        if (process.env.NODE_ENV === 'development') {
           setBlocks([
             {
               id: 'mock-1',
               name: 'Parcela Nord Nebbiolo (Mock)',
               area_ha: 2.5,
               geom: {
                 type: 'Polygon',
                 coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
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
   * Fetches historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
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

      // Mock data for development
      if (blockId.startsWith('mock-')) {
        return Array.from({ length: 12 }).map((_, i) => ({
          date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
          ndvi_mean: 0.3 + Math.random() * 0.5,
          ndmi_mean: 0.1 + Math.random() * 0.4,
          cloud_cover: Math.random() * 20
        }));
      }
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
