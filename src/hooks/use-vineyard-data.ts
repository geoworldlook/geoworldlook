'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        console.warn('[GeoWorldLook] Supabase client variables not found. Falling back to mock data.');
        setBlocks(MOCK_VINEYARDS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry,
          timeSeries: [] // Will be loaded on selection
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message || 'Error fetching vineyard blocks');
        setBlocks(MOCK_VINEYARDS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || blockId.startsWith('block-')) {
      const mockBlock = MOCK_VINEYARDS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries || [] : [];
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

export const MOCK_VINEYARDS: VineyardBlock[] = [
  {
    id: "block-1",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.5,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.501, 51.901],
          [15.509, 51.901],
          [15.509, 51.908],
          [15.501, 51.908],
          [15.501, 51.901]
        ]
      ]
    },
    timeSeries: [
      { date: "2025-01-15", ndvi_mean: 0.15, ndmi_mean: -0.1, cloud_cover: 5 },
      { date: "2025-02-15", ndvi_mean: 0.18, ndmi_mean: -0.05, cloud_cover: 12 },
      { date: "2025-03-15", ndvi_mean: 0.25, ndmi_mean: 0.05, cloud_cover: 8 },
      { date: "2025-04-15", ndvi_mean: 0.42, ndmi_mean: 0.15, cloud_cover: 22 },
      { date: "2025-05-15", ndvi_mean: 0.65, ndmi_mean: 0.35, cloud_cover: 15 },
      { date: "2025-06-15", ndvi_mean: 0.78, ndmi_mean: 0.48, cloud_cover: 4 },
      { date: "2025-07-15", ndvi_mean: 0.82, ndmi_mean: 0.52, cloud_cover: 10 },
      { date: "2025-08-15", ndvi_mean: 0.75, ndmi_mean: 0.45, cloud_cover: 18 },
      { date: "2025-09-15", ndvi_mean: 0.60, ndmi_mean: 0.30, cloud_cover: 25 },
      { date: "2025-10-15", ndvi_mean: 0.45, ndmi_mean: 0.15, cloud_cover: 30 },
      { date: "2025-11-15", ndvi_mean: 0.30, ndmi_mean: 0.0, cloud_cover: 15 },
      { date: "2025-12-15", ndvi_mean: 0.20, ndmi_mean: -0.05, cloud_cover: 9 }
    ]
  },
  {
    id: "block-2",
    name: "Parcela Południe Pinot Noir",
    area_ha: 3.2,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.512, 51.912],
          [15.520, 51.912],
          [15.520, 51.919],
          [15.512, 51.919],
          [15.512, 51.912]
        ]
      ]
    },
    timeSeries: [
      { date: "2025-01-15", ndvi_mean: 0.12, ndmi_mean: -0.15, cloud_cover: 10 },
      { date: "2025-02-15", ndvi_mean: 0.15, ndmi_mean: -0.10, cloud_cover: 25 },
      { date: "2025-03-15", ndvi_mean: 0.22, ndmi_mean: 0.0, cloud_cover: 14 },
      { date: "2025-04-15", ndvi_mean: 0.38, ndmi_mean: 0.12, cloud_cover: 30 },
      { date: "2025-05-15", ndvi_mean: 0.60, ndmi_mean: 0.32, cloud_cover: 5 },
      { date: "2025-06-15", ndvi_mean: 0.72, ndmi_mean: 0.42, cloud_cover: 12 },
      { date: "2025-07-15", ndvi_mean: 0.78, ndmi_mean: 0.46, cloud_cover: 15 },
      { date: "2025-08-15", ndvi_mean: 0.70, ndmi_mean: 0.38, cloud_cover: 20 },
      { date: "2025-09-15", ndvi_mean: 0.55, ndmi_mean: 0.25, cloud_cover: 8 },
      { date: "2025-10-15", ndvi_mean: 0.40, ndmi_mean: 0.10, cloud_cover: 35 },
      { date: "2025-11-15", ndvi_mean: 0.28, ndmi_mean: -0.02, cloud_cover: 18 },
      { date: "2025-12-15", ndvi_mean: 0.18, ndmi_mean: -0.08, cloud_cover: 11 }
    ]
  }
];
