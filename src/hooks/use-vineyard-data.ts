
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for initial development if Supabase is not yet populated
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.50, 51.93], [15.52, 51.93], [15.52, 51.94], [15.50, 51.94], [15.50, 51.93]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 2.5
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.53, 51.93], [15.55, 51.93], [15.55, 51.94], [15.53, 51.94], [15.53, 51.93]]]
      },
      properties: {
        id: 'mock-2',
        name: 'Parcela South Riesling',
        area_ha: 1.8
      }
    }
  ]
};

const MOCK_STATS: VineyardStat[] = Array.from({ length: 12 }).map((_, i) => ({
  date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
  ndvi_mean: 0.3 + Math.random() * 0.5,
  ndmi_mean: 0.1 + Math.random() * 0.4,
  cloud_cover: Math.random() * 20
}));

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
           console.warn('Using mock blocks due to error:', error);
           setBlocks(MOCK_BLOCKS);
        } else if (!data || !data.features || data.features.length === 0) {
           console.warn('Using mock blocks because no data returned');
           setBlocks(MOCK_BLOCKS);
        } else {
           setBlocks(data);
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
      return MOCK_STATS;
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
