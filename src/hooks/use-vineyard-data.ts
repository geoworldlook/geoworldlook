
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.50, 51.94], [15.51, 51.94], [15.51, 51.95], [15.50, 51.95], [15.50, 51.94]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Zielona Góra - Winnica Testowa',
        area_ha: 2.5
      }
    }
  ]
};

const MOCK_STATS: VineyardStats[] = Array.from({ length: 12 }, (_, i) => ({
  date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
  ndvi_mean: 0.3 + Math.random() * 0.5,
  ndmi_mean: 0.1 + Math.random() * 0.4,
  cloud_cover: Math.random() * 20
}));

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('Supabase not configured, using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;
        setBlocks(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || blockId.startsWith('mock-')) {
      return MOCK_STATS;
    }

    const supabase = createClient();
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
