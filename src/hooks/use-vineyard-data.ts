'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardBlockTimeSeries } from '@/types/vineyard';

// Zielona Góra region in Poland coordinates (approx [15.52, 51.93])
const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-pinot-noir',
    name: 'Parcela Pinot Noir',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.510, 51.930],
          [15.515, 51.930],
          [15.515, 51.935],
          [15.510, 51.935],
          [15.510, 51.930]
        ]
      ]
    },
    timeSeries: [
      { date: '2024-05-15', ndvi_mean: 0.65, ndmi_mean: 0.28, cloud_cover: 12.5 },
      { date: '2024-07-20', ndvi_mean: 0.82, ndmi_mean: 0.15, cloud_cover: 5.0 },
      { date: '2024-09-10', ndvi_mean: 0.74, ndmi_mean: 0.18, cloud_cover: 18.2 },
      { date: '2024-11-05', ndvi_mean: 0.42, ndmi_mean: 0.35, cloud_cover: 35.0 },
      { date: '2024-12-12', ndvi_mean: 0.25, ndmi_mean: 0.42, cloud_cover: 38.5 },
      { date: '2025-01-15', ndvi_mean: 0.22, ndmi_mean: 0.45, cloud_cover: 22.0 },
      { date: '2025-03-22', ndvi_mean: 0.38, ndmi_mean: 0.38, cloud_cover: 28.1 },
      { date: '2025-05-18', ndvi_mean: 0.68, ndmi_mean: 0.30, cloud_cover: 10.2 }
    ]
  },
  {
    id: 'block-chardonnay',
    name: 'Parcela Chardonnay',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.520, 51.930],
          [15.525, 51.930],
          [15.525, 51.935],
          [15.520, 51.935],
          [15.520, 51.930]
        ]
      ]
    },
    timeSeries: [
      { date: '2024-05-15', ndvi_mean: 0.58, ndmi_mean: 0.32, cloud_cover: 15.0 },
      { date: '2024-07-20', ndvi_mean: 0.79, ndmi_mean: 0.11, cloud_cover: 2.1 },
      { date: '2024-09-10', ndvi_mean: 0.71, ndmi_mean: 0.14, cloud_cover: 25.4 },
      { date: '2024-11-05', ndvi_mean: 0.39, ndmi_mean: 0.32, cloud_cover: 30.0 },
      { date: '2024-12-12', ndvi_mean: 0.28, ndmi_mean: 0.40, cloud_cover: 40.0 },
      { date: '2025-01-15', ndvi_mean: 0.24, ndmi_mean: 0.42, cloud_cover: 18.5 },
      { date: '2025-03-22', ndvi_mean: 0.41, ndmi_mean: 0.36, cloud_cover: 19.8 },
      { date: '2025-05-18', ndvi_mean: 0.61, ndmi_mean: 0.31, cloud_cover: 8.5 }
    ]
  },
  {
    id: 'block-riesling',
    name: 'Parcela Riesling',
    area_ha: 3.10,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.515, 51.936],
          [15.525, 51.936],
          [15.525, 51.942],
          [15.515, 51.942],
          [15.515, 51.936]
        ]
      ]
    },
    timeSeries: [
      { date: '2024-05-15', ndvi_mean: 0.62, ndmi_mean: 0.29, cloud_cover: 12.5 },
      { date: '2024-07-20', ndvi_mean: 0.85, ndmi_mean: 0.18, cloud_cover: 4.5 },
      { date: '2024-09-10', ndvi_mean: 0.76, ndmi_mean: 0.20, cloud_cover: 14.0 },
      { date: '2024-11-05', ndvi_mean: 0.45, ndmi_mean: 0.36, cloud_cover: 31.0 },
      { date: '2024-12-12', ndvi_mean: 0.23, ndmi_mean: 0.44, cloud_cover: 39.0 },
      { date: '2025-01-15', ndvi_mean: 0.21, ndmi_mean: 0.46, cloud_cover: 25.0 },
      { date: '2025-03-22', ndvi_mean: 0.35, ndmi_mean: 0.40, cloud_cover: 24.2 },
      { date: '2025-05-18', ndvi_mean: 0.64, ndmi_mean: 0.32, cloud_cover: 11.0 }
    ]
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const hasEnv = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (!hasEnv) {
        console.warn('[GeoWorldLook] Supabase env variables missing — using mock vineyard blocks');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Call RPC get_vineyard_blocks_geojson
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const geojson = data || { type: 'FeatureCollection', features: [] };
        const formattedBlocks: VineyardBlock[] = (geojson.features || []).map((feat: any) => ({
          id: feat.properties.id || feat.id,
          name: feat.properties.name,
          area_ha: Number(feat.properties.area_ha),
          geom: feat.geometry,
          timeSeries: [] // Initial empty, loaded on selection or backfilled
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data to keep UI functional
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardBlockTimeSeries[]> {
    const hasEnv = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!hasEnv) {
      // Find within MOCK_VINEYARD_BLOCKS
      const found = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return found ? found.timeSeries : [];
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
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
      // Fallback within mock data
      const found = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return found ? found.timeSeries : [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
