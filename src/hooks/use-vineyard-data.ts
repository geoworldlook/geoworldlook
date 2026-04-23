
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not connected
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.45,
    geometry: {
      type: 'Polygon',
      coordinates: [[[15.500, 51.900], [15.505, 51.900], [15.505, 51.905], [15.500, 51.905], [15.500, 51.900]]]
    }
  },
  {
    id: 'mock-2',
    name: 'South Slope Chardonnay',
    area_ha: 1.80,
    geometry: {
      type: 'Polygon',
      coordinates: [[[15.510, 51.910], [15.515, 51.910], [15.515, 51.915], [15.510, 51.915], [15.510, 51.910]]]
    }
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only create client if env vars are present to avoid crash
  const supabase = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createClient()
    : null;

  useEffect(() => {
    async function fetchBlocks() {
      if (!supabase) {
        console.warn('Supabase credentials missing, using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const geojson = data as any;
        const formattedBlocks: VineyardBlock[] = geojson.features.map((f: any) => ({
          id: f.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geometry: f.geometry
        }));

        setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [supabase]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!supabase || blockId.startsWith('mock-')) {
      // Return mock stats
      return Array.from({ length: 12 }).map((_, i) => ({
        date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
        ndvi_mean: 0.3 + Math.random() * 0.5,
        ndmi_mean: -0.2 + Math.random() * 0.4,
        cloud_cover: Math.random() * 20
      }));
    }

    try {
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
