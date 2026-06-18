'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = supabaseUrl && supabaseKey ? createClient() : null;

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }

        // Use the RPC function to get geometry as GeoJSON
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error || !data || data.length === 0) {
          console.warn('Using mock data for vineyard blocks');
          setBlocks([
            {
              id: 'block-1',
              name: 'Parcela Nord Nebbiolo',
              area_ha: 2.45,
              geom: {
                type: 'Polygon',
                coordinates: [[
                  [15.534, 51.935],
                  [15.538, 51.935],
                  [15.538, 51.938],
                  [15.534, 51.938],
                  [15.534, 51.935]
                ]]
              },
              created_at: new Date().toISOString()
            }
          ]);
          return;
        }

        // Map rpc result fields to VineyardBlock interface
        const formattedBlocks: VineyardBlock[] = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          area_ha: b.area_ha,
          geom: b.geom_geojson,
          created_at: b.created_at
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
   * Fetches the historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        if (blockId === 'block-1') {
          return [
            { block_id: 'block-1', date: '2024-05-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.32 },
            { block_id: 'block-1', date: '2024-05-05', cloud_cover: 12, ndvi_mean: 0.48, ndmi_mean: 0.35 },
            { block_id: 'block-1', date: '2024-05-10', cloud_cover: 2, ndvi_mean: 0.52, ndmi_mean: 0.38 },
            { block_id: 'block-1', date: '2024-05-15', cloud_cover: 25, ndvi_mean: 0.55, ndmi_mean: 0.41 },
            { block_id: 'block-1', date: '2024-05-20', cloud_cover: 0, ndvi_mean: 0.58, ndmi_mean: 0.44 },
          ];
        }
        return [];
      }

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
