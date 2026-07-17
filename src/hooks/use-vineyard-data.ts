'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard';

// Check if Supabase env variables are present
const hasSupabaseEnv = () => {
  return (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// Mock data for local fallback when Supabase is not configured
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-regent-1',
    name: 'Parcela Zachodnia Regent',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.501, 51.931],
          [15.506, 51.931],
          [15.506, 51.935],
          [15.501, 51.935],
          [15.501, 51.931]
        ]
      ]
    }
  },
  {
    id: 'block-solaris-2',
    name: 'Parcela Wschodnia Solaris',
    area_ha: 3.10,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.511, 51.931],
          [15.516, 51.931],
          [15.516, 51.935],
          [15.511, 51.935],
          [15.511, 51.931]
        ]
      ]
    }
  }
];

const MOCK_STATS: Record<string, VineyardBlockStats[]> = {
  'block-regent-1': [
    { date: '2025-01-15', ndvi_mean: 0.210, ndmi_mean: 0.120, cloud_cover: 5.2 },
    { date: '2025-02-18', ndvi_mean: 0.230, ndmi_mean: 0.140, cloud_cover: 12.0 },
    { date: '2025-03-20', ndvi_mean: 0.310, ndmi_mean: 0.180, cloud_cover: 8.5 },
    { date: '2025-04-15', ndvi_mean: 0.450, ndmi_mean: 0.220, cloud_cover: 15.1 },
    { date: '2025-05-18', ndvi_mean: 0.620, ndmi_mean: 0.280, cloud_cover: 3.2 },
    { date: '2025-06-22', ndvi_mean: 0.730, ndmi_mean: 0.350, cloud_cover: 6.4 },
    { date: '2025-07-20', ndvi_mean: 0.780, ndmi_mean: 0.320, cloud_cover: 18.2 },
    { date: '2025-08-15', ndvi_mean: 0.710, ndmi_mean: 0.290, cloud_cover: 9.0 },
    { date: '2025-09-18', ndvi_mean: 0.580, ndmi_mean: 0.240, cloud_cover: 11.3 },
    { date: '2025-10-20', ndvi_mean: 0.420, ndmi_mean: 0.190, cloud_cover: 14.5 },
    { date: '2025-11-15', ndvi_mean: 0.290, ndmi_mean: 0.150, cloud_cover: 22.1 },
    { date: '2025-12-18', ndvi_mean: 0.220, ndmi_mean: 0.110, cloud_cover: 7.8 }
  ],
  'block-solaris-2': [
    { date: '2025-01-15', ndvi_mean: 0.250, ndmi_mean: 0.150, cloud_cover: 4.8 },
    { date: '2025-02-18', ndvi_mean: 0.270, ndmi_mean: 0.160, cloud_cover: 10.5 },
    { date: '2025-03-20', ndvi_mean: 0.350, ndmi_mean: 0.190, cloud_cover: 9.2 },
    { date: '2025-04-15', ndvi_mean: 0.490, ndmi_mean: 0.240, cloud_cover: 13.0 },
    { date: '2025-05-18', ndvi_mean: 0.680, ndmi_mean: 0.310, cloud_cover: 2.1 },
    { date: '2025-06-22', ndvi_mean: 0.790, ndmi_mean: 0.380, cloud_cover: 5.0 },
    { date: '2025-07-20', ndvi_mean: 0.820, ndmi_mean: 0.340, cloud_cover: 15.5 },
    { date: '2025-08-15', ndvi_mean: 0.750, ndmi_mean: 0.310, cloud_cover: 8.2 },
    { date: '2025-09-18', ndvi_mean: 0.620, ndmi_mean: 0.260, cloud_cover: 10.0 },
    { date: '2025-10-20', ndvi_mean: 0.460, ndmi_mean: 0.210, cloud_cover: 12.8 },
    { date: '2025-11-15', ndvi_mean: 0.320, ndmi_mean: 0.170, cloud_cover: 20.0 },
    { date: '2025-12-18', ndvi_mean: 0.260, ndmi_mean: 0.130, cloud_cover: 6.5 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasSupabaseEnv()) {
        console.warn('[GeoWorldLook] Supabase env variables missing. Falling back to mock vineyard blocks.');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // Convert FeatureCollection back to VineyardBlock format
        const formattedBlocks: VineyardBlock[] = (data?.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data to keep UI stable
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardBlockStats[]> {
    if (!hasSupabaseEnv()) {
      return MOCK_STATS[blockId] || [];
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
      // Fallback to mock data for consistent UX
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
