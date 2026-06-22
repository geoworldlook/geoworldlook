
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for fallback when Supabase is not configured
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: '1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.930],
        [15.525, 51.930],
        [15.525, 51.935],
        [15.520, 51.935],
        [15.520, 51.930]
      ]]
    }
  },
  {
    id: '2',
    name: 'South Slope Chardonnay',
    area_ha: 3.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.920],
        [15.518, 51.920],
        [15.518, 51.928],
        [15.510, 51.928],
        [15.510, 51.920]
      ]]
    }
  }
];

function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 5);
    stats.push({
      date: date.toISOString().split('T')[0],
      ndvi_mean: 0.4 + Math.random() * 0.4,
      ndmi_mean: 0.1 + Math.random() * 0.3,
      cloud_cover: Math.random() * 20
    });
  }
  return stats;
}

/**
 * Custom hook for managing vineyard data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Fetch all vineyard blocks
  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnvVars) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        // Using the RPC function we created in the migration
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection
        const formattedBlocks: VineyardBlock[] = (data?.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          stats: [] // Initialized empty
        }));

        if (formattedBlocks.length === 0) {
           setBlocks(MOCK_BLOCKS);
        } else {
           setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasEnvVars]);

  /**
   * Fetches the historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!hasEnvVars || blockId.length < 10) { // Simple check if it's a mock ID
      return generateMockStats(blockId);
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return generateMockStats(blockId);
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
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
