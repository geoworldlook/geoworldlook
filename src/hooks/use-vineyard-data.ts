
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for Zielona Góra region (approx [15.5, 51.9])
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.50, 51.93],
          [15.51, 51.93],
          [15.51, 51.94],
          [15.50, 51.94],
          [15.50, 51.93]
        ]]
      },
      properties: {
        id: 'block-1',
        name: 'Słoneczne Wzgórze - Riesling',
        area_ha: 2.4
      }
    },
    {
      type: 'Feature',
      id: 'block-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.52, 51.92],
          [15.53, 51.92],
          [15.53, 51.93],
          [15.52, 51.93],
          [15.52, 51.92]
        ]]
      },
      properties: {
        id: 'block-2',
        name: 'Dolina Odry - Pinot Noir',
        area_ha: 1.8
      }
    }
  ]
};

function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      cloud_cover: Math.random() * 20,
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: 0.1 + Math.random() * 0.4
    });
  }
  return stats.reverse();
}

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 */
export function useVineyardData() {
  const [blocksGeoJson, setBlocksGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        setBlocksGeoJson(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;
        setBlocksGeoJson(data || MOCK_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocksGeoJson(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return generateMockStats(blockId);
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return generateMockStats(blockId);
    }
  }

  return {
    blocksGeoJson,
    loading,
    error,
    getBlockStats
  };
}
