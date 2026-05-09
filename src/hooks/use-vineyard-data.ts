
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 * - Fetches all vineyard blocks for map display.
 * - Fetches historical NDVI/NDMI stats for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for fallback or development
  const MOCK_BLOCKS: VineyardBlock[] = [
    {
      id: 'mock-1',
      name: 'Parcela Nord Nebbiolo',
      area_ha: 2.5,
      geom: {
        type: 'Polygon',
        coordinates: [[
          [15.500, 51.900],
          [15.505, 51.900],
          [15.505, 51.905],
          [15.500, 51.905],
          [15.500, 51.900]
        ]]
      },
      created_at: new Date().toISOString()
    }
  ];

  const MOCK_STATS: VineyardStat[] = Array.from({ length: 12 }).map((_, i) => ({
    block_id: 'mock-1',
    date: `2024-${String(i + 1).padStart(2, '0')}-01`,
    cloud_cover: Math.random() * 20,
    ndvi_mean: 0.3 + Math.random() * 0.5,
    ndmi_mean: 0.1 + Math.random() * 0.4
  }));

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
          console.warn('Supabase fetch error, using mock data:', error);
          setBlocks(MOCK_BLOCKS);
          return;
        }

        setBlocks(data || []);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS;
    }

    try {
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
