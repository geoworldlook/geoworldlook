
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase (Polygons).
 * - Fetches all vineyard blocks for map rendering.
 * - Fetches historical statistics for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('[GeoWorldLook] Supabase env vars missing — using mock data');
          setBlocks(MOCK_VINEYARD_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        // Prefer using the RPC function we created in the migration for robust GeoJSON delivery
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        let formattedData = data;

        if (error) {
          console.warn('[GeoWorldLook] RPC failed, falling back to direct select:', error);
          const { data: selectData, error: selectError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (selectError) throw selectError;

          formattedData = (selectData as any[]).map(item => ({
            ...item,
            geom: typeof item.geom === 'string' ? JSON.parse(item.geom) : item.geom
          }));
        }

        if (!formattedData || formattedData.length === 0) {
          console.warn('[GeoWorldLook] No blocks found in DB — using mock data');
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          setBlocks(formattedData as VineyardBlock[]);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS);
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
    // If blockId starts with 'block-', it's likely our mock data
    if (blockId.startsWith('block-')) {
      return MOCK_VINEYARD_STATS[blockId] || [];
    }

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_VINEYARD_STATS['block-ch-01'] || [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
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
