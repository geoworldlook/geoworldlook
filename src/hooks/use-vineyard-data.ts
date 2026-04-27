
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not connected or empty
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
    }
  },
  {
    id: 'mock-2',
    name: 'South Slope Riesling',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.910],
        [15.515, 51.910],
        [15.515, 51.915],
        [15.510, 51.915],
        [15.510, 51.910]
      ]]
    }
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Check if Supabase env vars are present before creating client
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!hasSupabase) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase error or RPC missing, using mock data:', error);
          setBlocks(MOCK_BLOCKS);
          return;
        }

        if (data && data.features) {
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_BLOCKS);
        } else {
          setBlocks(MOCK_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      // Return some mock stats
      return Array.from({ length: 12 }).map((_, i) => ({
        block_id: blockId,
        date: new Date(2023, i, 1).toISOString().split('T')[0],
        cloud_cover: Math.random() * 20,
        ndvi_mean: 0.3 + Math.random() * 0.5,
        ndmi_mean: 0.1 + Math.random() * 0.4
      }));
    }

    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasSupabase) return [];

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
