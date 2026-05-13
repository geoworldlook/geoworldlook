'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
const MOCK_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.50, 51.93], [15.52, 51.93], [15.52, 51.95], [15.50, 51.95], [15.50, 51.93]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Zielona Góra Vineyard A',
        area_ha: 12.5
      }
    }
  ]
};

const MOCK_STATS: VineyardStat[] = [
  { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
  { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.15, cloud_cover: 20 },
  { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.3, cloud_cover: 5 },
  { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.5, cloud_cover: 0 },
  { date: '2024-05-01', ndvi_mean: 0.8, ndmi_mean: 0.7, cloud_cover: 2 }
];

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [geoJson, setGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function fetchBlocks() {
      if (!isSupabaseConfigured) {
        console.warn('Supabase env vars missing — using mock GeoJSON data');
        setGeoJson(MOCK_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (error) throw error;
        setGeoJson(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setGeoJson(MOCK_GEOJSON); // Fallback to mock
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [isSupabaseConfigured]);

  /**
   * Fetches the historical stats for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!isSupabaseConfigured) {
      return MOCK_STATS;
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
      return MOCK_STATS; // Fallback
    }
  }

  return {
    geoJson,
    loading,
    error,
    getBlockStats
  };
}
