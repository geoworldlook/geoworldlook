
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS, MOCK_VINEYARD_STATS } from '@/lib/mock-data/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          console.warn('No data from Supabase, falling back to mock data');
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          setBlocks(data);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        // Silently fallback to mock data if there's an error (e.g. table doesn't exist yet)
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        return MOCK_VINEYARD_STATS[blockId] || [];
      }

      return data;
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_VINEYARD_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
