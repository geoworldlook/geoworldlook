
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const MOCK_BLOCKS: VineyardBlock[] = [
    {
      id: 'mock-1',
      name: 'Parcela Nord Nebbiolo',
      area_ha: 2.5,
      geom: {
        type: 'Polygon',
        coordinates: [[[15.500, 51.900], [15.505, 51.900], [15.505, 51.905], [15.500, 51.905], [15.500, 51.900]]]
      }
    },
    {
      id: 'mock-2',
      name: 'South Slope Riesling',
      area_ha: 1.8,
      geom: {
        type: 'Polygon',
        coordinates: [[[15.510, 51.910], [15.515, 51.910], [15.515, 51.915], [15.510, 51.915], [15.510, 51.910]]]
      }
    }
  ];

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
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
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      return Array.from({ length: 12 }).map((_, i) => ({
        block_id: blockId,
        date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
        cloud_cover: Math.random() * 20,
        ndvi_mean: 0.4 + Math.random() * 0.4,
        ndmi_mean: 0.1 + Math.random() * 0.3
      }));
    }

    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: blockId,
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
