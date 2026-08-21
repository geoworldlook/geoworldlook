'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardFeatureCollection, VineyardFeature, VineyardStats } from '@/types/database.types';

const MOCK_FEATURE_COLLECTION: VineyardFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-1-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.501, 51.932],
            [15.508, 51.932],
            [15.507, 51.937],
            [15.500, 51.936],
            [15.501, 51.932]
          ]
        ]
      },
      properties: {
        id: 'block-1-zielona-gora',
        name: 'Winnica Srebrna Góra - Sektor A',
        area_ha: 3.45,
        created_at: '2024-01-15T10:00:00Z'
      }
    },
    {
      type: 'Feature',
      id: 'block-2-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.510, 51.930],
            [15.518, 51.929],
            [15.516, 51.934],
            [15.509, 51.935],
            [15.510, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-2-zielona-gora',
        name: 'Winnica Srebrna Góra - Sektor B (Solaris)',
        area_ha: 4.12,
        created_at: '2024-01-15T10:00:00Z'
      }
    },
    {
      type: 'Feature',
      id: 'block-3-zielona-gora',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.492, 51.925],
            [15.498, 51.924],
            [15.497, 51.928],
            [15.490, 51.929],
            [15.492, 51.925]
          ]
        ]
      },
      properties: {
        id: 'block-3-zielona-gora',
        name: 'Winnica Turnau - Parcela Pinot Noir',
        area_ha: 2.80,
        created_at: '2024-02-01T10:00:00Z'
      }
    }
  ]
};

const MOCK_TIME_SERIES: Record<string, VineyardStats[]> = {
  'block-1-zielona-gora': [
    { date: '2023-04-15', ndvi_mean: 0.32, ndmi_mean: 0.15, cloud_cover: 12.0 },
    { date: '2023-05-20', ndvi_mean: 0.54, ndmi_mean: 0.28, cloud_cover: 5.0 },
    { date: '2023-06-18', ndvi_mean: 0.76, ndmi_mean: 0.42, cloud_cover: 2.0 },
    { date: '2023-07-22', ndvi_mean: 0.82, ndmi_mean: 0.38, cloud_cover: 10.0 },
    { date: '2023-08-25', ndvi_mean: 0.79, ndmi_mean: 0.31, cloud_cover: 0.0 },
    { date: '2023-09-18', ndvi_mean: 0.65, ndmi_mean: 0.22, cloud_cover: 15.0 },
    { date: '2023-10-15', ndvi_mean: 0.45, ndmi_mean: 0.12, cloud_cover: 8.0 }
  ],
  'block-2-zielona-gora': [
    { date: '2023-04-15', ndvi_mean: 0.28, ndmi_mean: 0.12, cloud_cover: 12.0 },
    { date: '2023-05-20', ndvi_mean: 0.49, ndmi_mean: 0.24, cloud_cover: 5.0 },
    { date: '2023-06-18', ndvi_mean: 0.71, ndmi_mean: 0.39, cloud_cover: 2.0 },
    { date: '2023-07-22', ndvi_mean: 0.85, ndmi_mean: 0.45, cloud_cover: 10.0 },
    { date: '2023-08-25', ndvi_mean: 0.81, ndmi_mean: 0.35, cloud_cover: 0.0 },
    { date: '2023-09-18', ndvi_mean: 0.68, ndmi_mean: 0.25, cloud_cover: 15.0 },
    { date: '2023-10-15', ndvi_mean: 0.42, ndmi_mean: 0.10, cloud_cover: 8.0 }
  ],
  'block-3-zielona-gora': [
    { date: '2023-04-15', ndvi_mean: 0.30, ndmi_mean: 0.14, cloud_cover: 12.0 },
    { date: '2023-05-20', ndvi_mean: 0.52, ndmi_mean: 0.26, cloud_cover: 5.0 },
    { date: '2023-06-18', ndvi_mean: 0.74, ndmi_mean: 0.40, cloud_cover: 2.0 },
    { date: '2023-07-22', ndvi_mean: 0.78, ndmi_mean: 0.34, cloud_cover: 10.0 },
    { date: '2023-08-25', ndvi_mean: 0.75, ndmi_mean: 0.29, cloud_cover: 0.0 },
    { date: '2023-09-18', ndvi_mean: 0.61, ndmi_mean: 0.19, cloud_cover: 15.0 },
    { date: '2023-10-15', ndvi_mean: 0.38, ndmi_mean: 0.08, cloud_cover: 8.0 }
  ]
};

export function useVineyardData() {
  const [blocksGeoJson, setBlocksGeoJson] = useState<VineyardFeatureCollection>({
    type: 'FeatureCollection',
    features: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
        setBlocksGeoJson(MOCK_FEATURE_COLLECTION);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        if (data && data.features && data.features.length > 0) {
          setBlocksGeoJson(data as VineyardFeatureCollection);
        } else {
          setBlocksGeoJson(MOCK_FEATURE_COLLECTION);
        }
      } catch (err: any) {
        console.warn('Using mock vineyard blocks fallback due to RPC error:', err.message);
        setBlocksGeoJson(MOCK_FEATURE_COLLECTION);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  const getBlockStats = useCallback(async (blockId: string): Promise<VineyardStats[]> => {
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!hasSupabaseUrl || !hasSupabaseAnonKey) {
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1-zielona-gora'];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1-zielona-gora'];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`Fallback to mock stats for block ${blockId}:`, err.message);
      return MOCK_TIME_SERIES[blockId] || MOCK_TIME_SERIES['block-1-zielona-gora'];
    }
  }, []);

  return {
    blocksGeoJson,
    loading,
    error,
    getBlockStats
  };
}
