
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
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

        // Use RPC to get GeoJSON if possible, otherwise regular select
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC get_vineyard_blocks_geojson failed, falling back to regular select:', error.message);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (fallbackError) throw fallbackError;

          setBlocks((fallbackData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geom: b.geom // Might need processing if not returned as GeoJSON
          })));
        } else {
          setBlocks((data || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geom: b.geom_json
          })));
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Provide mock data for development if Supabase is not reachable
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            setBlocks([
                {
                    id: 'mock-1',
                    name: 'Parcela Nord Nebbiolo (Mock)',
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
   * Fetches statistics for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
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

      // Return mock stats for development
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          return Array.from({ length: 12 }, (_, i) => ({
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
