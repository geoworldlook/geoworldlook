
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Hook for managing vineyard block data (polygons) and their satellite stats.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
           throw new Error('Supabase environment variables are missing');
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
          console.warn('Database fetch failed, checking for mock data possibility:', error.message);
          throw error;
        }

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if DB is not ready or env vars missing
        setBlocks([
          {
            id: 'dev-block-1',
            name: 'Nebbiolo South',
            area_ha: 1.2,
            geom: {
              type: 'Polygon',
              coordinates: [[
                [15.510, 51.910],
                [15.515, 51.910],
                [15.515, 51.915],
                [15.510, 51.915],
                [15.510, 51.910]
              ]]
            },
            created_at: new Date().toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical NDVI and NDMI stats for a specific block.
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

      // Return some mock stats if it's the dev block or env vars missing
      if (blockId === 'dev-block-1' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return Array.from({ length: 10 }).map((_, i) => ({
          block_id: blockId,
          date: `2024-05-${10 + i}`,
          cloud_cover: Math.random() * 20,
          ndvi_mean: 0.4 + Math.random() * 0.3,
          ndmi_mean: 0.2 + Math.random() * 0.2
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
