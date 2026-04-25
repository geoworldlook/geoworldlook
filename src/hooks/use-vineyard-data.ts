
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Check if env vars exist before creating client
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock blocks');
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
              },
              properties: {
                id: 'mock-1',
                name: 'Parcela Nord Nebbiolo (Mock)',
                area_ha: 2.5
              }
            }
          ]
        });
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

        // Fallback to mock data
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
              },
              properties: {
                id: 'mock-1',
                name: 'Parcela Nord Nebbiolo (Mock)',
                area_ha: 2.5
              }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock') || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return [
        { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.4, ndmi_mean: 0.2 },
        { date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.45, ndmi_mean: 0.25 },
        { date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.6, ndmi_mean: 0.4 },
        { date: '2024-04-01', cloud_cover: 8, ndvi_mean: 0.7, ndmi_mean: 0.5 },
        { date: '2024-05-01', cloud_cover: 12, ndvi_mean: 0.75, ndmi_mean: 0.55 },
      ];
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
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
