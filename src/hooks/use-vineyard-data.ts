'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardStats } from '@/types/vineyard';

// Mock GeoJSON features in Zielona Góra, Poland (approx [15.5, 51.9])
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1, // numerical id for internal MapLibre features
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.500, 51.930],
            [15.510, 51.930],
            [15.510, 51.935],
            [15.500, 51.935],
            [15.500, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-1',
        name: 'Parcela Północna Pinot Noir',
        area_ha: 4.5
      }
    },
    {
      type: 'Feature',
      id: 2,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.515, 51.930],
            [15.525, 51.930],
            [15.525, 51.935],
            [15.515, 51.935],
            [15.515, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-2',
        name: 'Parcela Południowa Chardonnay',
        area_ha: 3.8
      }
    }
  ]
};

const MOCK_STATS: Record<string, VineyardStats[]> = {
  'block-1': [
    { block_id: 'block-1', date: '2025-05-15', ndvi_mean: 0.45, ndmi_mean: 0.15, cloud_cover: 5.0 },
    { block_id: 'block-1', date: '2025-06-12', ndvi_mean: 0.65, ndmi_mean: 0.25, cloud_cover: 12.0 },
    { block_id: 'block-1', date: '2025-07-20', ndvi_mean: 0.78, ndmi_mean: 0.35, cloud_cover: 2.0 },
    { block_id: 'block-1', date: '2025-08-15', ndvi_mean: 0.82, ndmi_mean: 0.40, cloud_cover: 15.0 },
    { block_id: 'block-1', date: '2025-09-10', ndvi_mean: 0.60, ndmi_mean: 0.20, cloud_cover: 8.0 },
    { block_id: 'block-1', date: '2025-10-05', ndvi_mean: 0.40, ndmi_mean: 0.10, cloud_cover: 22.0 },
    { block_id: 'block-1', date: '2025-11-12', ndvi_mean: 0.25, ndmi_mean: 0.05, cloud_cover: 30.0 },
    { block_id: 'block-1', date: '2025-12-15', ndvi_mean: 0.15, ndmi_mean: -0.02, cloud_cover: 35.0 },
    { block_id: 'block-1', date: '2026-01-20', ndvi_mean: 0.12, ndmi_mean: -0.05, cloud_cover: 40.0 },
    { block_id: 'block-1', date: '2026-02-18', ndvi_mean: 0.18, ndmi_mean: -0.01, cloud_cover: 28.0 },
    { block_id: 'block-1', date: '2026-03-10', ndvi_mean: 0.30, ndmi_mean: 0.08, cloud_cover: 18.0 },
    { block_id: 'block-1', date: '2026-04-15', ndvi_mean: 0.55, ndmi_mean: 0.22, cloud_cover: 10.0 }
  ],
  'block-2': [
    { block_id: 'block-2', date: '2025-05-15', ndvi_mean: 0.42, ndmi_mean: 0.12, cloud_cover: 5.0 },
    { block_id: 'block-2', date: '2025-06-12', ndvi_mean: 0.60, ndmi_mean: 0.22, cloud_cover: 12.0 },
    { block_id: 'block-2', date: '2025-07-20', ndvi_mean: 0.72, ndmi_mean: 0.30, cloud_cover: 2.0 },
    { block_id: 'block-2', date: '2025-08-15', ndvi_mean: 0.80, ndmi_mean: 0.38, cloud_cover: 15.0 },
    { block_id: 'block-2', date: '2025-09-10', ndvi_mean: 0.58, ndmi_mean: 0.18, cloud_cover: 8.0 },
    { block_id: 'block-2', date: '2025-10-05', ndvi_mean: 0.38, ndmi_mean: 0.08, cloud_cover: 22.0 },
    { block_id: 'block-2', date: '2025-11-12', ndvi_mean: 0.22, ndmi_mean: 0.02, cloud_cover: 30.0 },
    { block_id: 'block-2', date: '2025-12-15', ndvi_mean: 0.12, ndmi_mean: -0.04, cloud_cover: 35.0 },
    { block_id: 'block-2', date: '2026-01-20', ndvi_mean: 0.10, ndmi_mean: -0.06, cloud_cover: 40.0 },
    { block_id: 'block-2', date: '2026-02-18', ndvi_mean: 0.15, ndmi_mean: -0.02, cloud_cover: 28.0 },
    { block_id: 'block-2', date: '2026-03-10', ndvi_mean: 0.28, ndmi_mean: 0.06, cloud_cover: 18.0 },
    { block_id: 'block-2', date: '2026-04-15', ndvi_mean: 0.50, ndmi_mean: 0.18, cloud_cover: 10.0 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checks for Supabase env variables to safely fallback to mock data
  const isSupabaseConfigured =
    typeof window !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS_GEOJSON);
        setLoading(false); // Explicitly set loading to false in mock data fallback branch
        return;
      }

      try {
        // Deferred instantiation of Supabase client to avoid issues during SSR
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        setBlocks(data || { type: 'FeatureCollection', features: [] });
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data on error
        setBlocks(MOCK_BLOCKS_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!isSupabaseConfigured) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      // Deferred instantiation of Supabase client to avoid issues during SSR
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
