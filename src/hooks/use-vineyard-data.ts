
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyards';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all vineyard blocks with their geometries
  useEffect(() => {
    async function fetchBlocks() {
      // Check if Supabase env vars are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo',
            area_ha: 2.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
            },
            stats: []
          }
        ]);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (tableError) throw tableError;

          setBlocks((tableData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geom: b.geom,
            stats: []
          })));
        } else {
          const features = data.features || [];
          setBlocks(features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry,
            stats: []
          })));
        }

      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
       // Mock stats
       return [
         { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
         { date: '2024-02-01', ndvi_mean: 0.3, ndmi_mean: 0.15, cloud_cover: 5 },
         { date: '2024-03-01', ndvi_mean: 0.5, ndmi_mean: 0.2, cloud_cover: 20 },
         { date: '2024-04-01', ndvi_mean: 0.7, ndmi_mean: 0.4, cloud_cover: 0 },
       ];
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
