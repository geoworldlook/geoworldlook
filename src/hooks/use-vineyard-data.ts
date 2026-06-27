
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyards';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Check if Supabase env vars are present before creating client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock data');
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo (Mock)',
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
        // Use the RPC function to get GeoJSON
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // Data is already in GeoJSON format from RPC
        const features = data.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          stats: [] // Initialized empty
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

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (blockId === 'mock-1') {
      return [
        { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
        { date: '2024-02-01', ndvi_mean: 0.3, ndmi_mean: 0.15, cloud_cover: 5 },
        { date: '2024-03-01', ndvi_mean: 0.5, ndmi_mean: 0.3, cloud_cover: 15 },
        { date: '2024-04-01', ndvi_mean: 0.7, ndmi_mean: 0.45, cloud_cover: 2 },
        { date: '2024-05-01', ndvi_mean: 0.8, ndmi_mean: 0.6, cloud_cover: 8 }
      ];
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [];

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
