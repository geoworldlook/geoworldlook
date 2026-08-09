'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyards';

// Mock data representing Zielona Góra (Lubuskie region) vineyard blocks in Poland
// Coordinates are specified in EPSG:4326 GeoJSON Polygon format
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    name: 'Winnica Górna - Parcela Riesling',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.505, 51.935],
        [15.512, 51.935],
        [15.512, 51.930],
        [15.505, 51.930],
        [15.505, 51.935]
      ]]
    }
  },
  {
    id: 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e',
    name: 'Winnica Dolna - Parcela Pinot Noir',
    area_ha: 4.12,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.515, 51.938],
        [15.525, 51.938],
        [15.525, 51.932],
        [15.515, 51.932],
        [15.515, 51.938]
      ]]
    }
  },
  {
    id: 'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
    name: 'Winnica Zachód - Parcela Solaris',
    area_ha: 1.85,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.492, 51.932],
        [15.499, 51.932],
        [15.499, 51.927],
        [15.492, 51.927],
        [15.492, 51.932]
      ]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardTimeSeries[]> = {
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d': [
    { date: '2025-05-01', ndvi_mean: 0.35, ndmi_mean: 0.12, cloud_cover: 5.2 },
    { date: '2025-06-01', ndvi_mean: 0.58, ndmi_mean: 0.22, cloud_cover: 12.0 },
    { date: '2025-07-01', ndvi_mean: 0.72, ndmi_mean: 0.28, cloud_cover: 3.5 },
    { date: '2025-08-01', ndvi_mean: 0.68, ndmi_mean: 0.24, cloud_cover: 18.2 },
    { date: '2025-09-01', ndvi_mean: 0.52, ndmi_mean: 0.15, cloud_cover: 8.0 },
    { date: '2025-10-01', ndvi_mean: 0.38, ndmi_mean: 0.08, cloud_cover: 22.4 }
  ],
  'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e': [
    { date: '2025-05-01', ndvi_mean: 0.32, ndmi_mean: 0.10, cloud_cover: 5.2 },
    { date: '2025-06-01', ndvi_mean: 0.52, ndmi_mean: 0.18, cloud_cover: 12.0 },
    { date: '2025-07-01', ndvi_mean: 0.69, ndmi_mean: 0.25, cloud_cover: 3.5 },
    { date: '2025-08-01', ndvi_mean: 0.64, ndmi_mean: 0.20, cloud_cover: 18.2 },
    { date: '2025-09-01', ndvi_mean: 0.48, ndmi_mean: 0.12, cloud_cover: 8.0 },
    { date: '2025-10-01', ndvi_mean: 0.34, ndmi_mean: 0.05, cloud_cover: 22.4 }
  ],
  'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f': [
    { date: '2025-05-01', ndvi_mean: 0.40, ndmi_mean: 0.15, cloud_cover: 5.2 },
    { date: '2025-06-01', ndvi_mean: 0.62, ndmi_mean: 0.25, cloud_cover: 12.0 },
    { date: '2025-07-01', ndvi_mean: 0.78, ndmi_mean: 0.32, cloud_cover: 3.5 },
    { date: '2025-08-01', ndvi_mean: 0.71, ndmi_mean: 0.28, cloud_cover: 18.2 },
    { date: '2025-09-01', ndvi_mean: 0.56, ndmi_mean: 0.18, cloud_cover: 8.0 },
    { date: '2025-10-01', ndvi_mean: 0.42, ndmi_mean: 0.10, cloud_cover: 22.4 }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Defer Supabase client creation to inside fetch functions to avoid build-time SSR issues
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Query the custom RPC function for GeoJSON format
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        if (data && data.features) {
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        } else {
          setBlocks([]);
        }
      } catch (err: any) {
        console.warn('Supabase fetch failed, falling back to mock data:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return MOCK_STATS[blockId] || [];
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error: statsError } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (statsError) throw statsError;

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`Database fetch failed for stats of block ${blockId}, falling back to mock stats:`, err);
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
