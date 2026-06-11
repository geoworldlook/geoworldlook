
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks (polygons) for map display.
 * - Fetches historical NDVI/NDMI time-series for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks([
          {
            id: 'mock-block-1',
            name: 'Parcela Nord Nebbiolo',
            area_ha: 4.5,
            geom: {
              type: 'Polygon',
              coordinates: [[
                [15.520, 51.940],
                [15.525, 51.940],
                [15.525, 51.945],
                [15.520, 51.945],
                [15.520, 51.940]
              ]]
            }
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        setBlocks(data || []);
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Return some mock stats for the mock block
      const stats: VineyardStat[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        stats.push({
          block_id: blockId,
          date: date.toISOString().split('T')[0],
          cloud_cover: Math.random() * 20,
          ndvi_mean: 0.4 + Math.random() * 0.4,
          ndmi_mean: 0.1 + Math.random() * 0.3
        });
      }
      return stats;
    }

    try {
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
