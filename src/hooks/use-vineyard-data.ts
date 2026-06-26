
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyards';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch all blocks for the map (as GeoJSON via RPC)
  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[GeoWorldLook] useVineyardData: Supabase env vars missing — using mock data');
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo (Mock)',
            area_ha: 4.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.50, 51.93], [15.52, 51.93], [15.52, 51.94], [15.50, 51.94], [15.50, 51.93]]]
            },
            stats: []
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // The RPC returns a FeatureCollection
        const featureCollection = data as any;
        const formattedBlocks: VineyardBlock[] = (featureCollection.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          stats: [] // Initialized empty, loaded on selection
        }));

        setBlocks(formattedBlocks);
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
   * Fetches the historical statistics for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Return mock stats
      return [
        { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: -0.1, cloud_cover: 10 },
        { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: -0.05, cloud_cover: 20 },
        { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.1, cloud_cover: 5 },
        { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.3, cloud_cover: 15 },
        { date: '2024-05-01', ndvi_mean: 0.75, ndmi_mean: 0.5, cloud_cover: 0 },
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
