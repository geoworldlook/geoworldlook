
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARDS, generateVineyardStats } from '@/lib/mock-data/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks for map visualization.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseConfigured =
    !!(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  // 1. Fetch all vineyard blocks for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!isSupabaseConfigured) {
          console.warn('[GeoWorldLook] Supabase env vars missing — using mock blocks');
          setBlocks(MOCK_VINEYARDS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        // Using standard PostGIS geometry to GeoJSON conversion if possible,
        // or just fetching the raw geom which is often returned as GeoJSON by PostgREST
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARDS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches the historical stats for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!isSupabaseConfigured) {
        return generateVineyardStats();
      }

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
      return generateVineyardStats();
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
