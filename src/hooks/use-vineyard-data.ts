
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS, generateMockStats } from '@/lib/mock-data/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        // Fetch polygons using PostGIS st_asgeojson
        // const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');
        const { data: blocksData, error: blocksError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

        if (blocksError) {
          console.warn('Supabase Error, using mock data:', blocksError.message);
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          setBlocks(blocksData as any);
        }

      } catch (err: any) {
        console.warn('Error fetching vineyard blocks, using mock data:', err);
        setBlocks(MOCK_VINEYARD_BLOCKS);
        // setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        console.warn('Supabase Error, using mock data for stats:', error.message);
        return generateMockStats(blockId);
      }
      return data as VineyardStat[];
    } catch (err: any) {
      console.warn(`Error fetching stats for block ${blockId}, using mock data:`, err);
      return generateMockStats(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
