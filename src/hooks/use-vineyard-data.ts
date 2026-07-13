
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 * - Fetches all vineyard blocks with their geometries.
 * - Fetches historical statistics (NDVI, NDMI) for a specific block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback mock data for development if Supabase is not configured
  const mockBlocks: VineyardBlock[] = [
    {
      id: 'mock-1',
      name: 'Parcela Nord Nebbiolo',
      area_ha: 2.5,
      geom: {
        type: 'Polygon',
        coordinates: [[
          [15.50, 51.90],
          [15.51, 51.90],
          [15.51, 51.91],
          [15.50, 51.91],
          [15.50, 51.90]
        ]]
      },
      stats: []
    }
  ];

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Supabase credentials missing, using mock data');
            setBlocks(mockBlocks);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const formattedBlocks: VineyardBlock[] = (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          area_ha: Number(b.area_ha),
          geom: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom,
          stats: []
        }));

        if (formattedBlocks.length === 0) {
            setBlocks(mockBlocks);
        } else {
            setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(mockBlocks);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (blockId.startsWith('mock-')) {
        return [
            { date: '2023-05-01', cloud_cover: 5, ndvi_mean: 0.4, ndmi_mean: 0.1 },
            { date: '2023-06-01', cloud_cover: 10, ndvi_mean: 0.6, ndmi_mean: 0.2 },
            { date: '2023-07-01', cloud_cover: 2, ndvi_mean: 0.8, ndmi_mean: 0.3 },
            { date: '2023-08-01', cloud_cover: 0, ndvi_mean: 0.7, ndmi_mean: 0.15 },
        ];
    }

    try {
      const supabase = createClient();
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
