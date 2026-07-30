'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Zielona Góra, Poland coordinates approx [15.5, 51.9]
export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 24.50,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.500, 51.930],
        [15.510, 51.930],
        [15.510, 51.935],
        [15.500, 51.935],
        [15.500, 51.930]
      ]]
    }
  },
  {
    id: "block-02",
    name: "Parcela Sopot Pinot Noir",
    area_ha: 18.20,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.520, 51.935],
        [15.530, 51.935],
        [15.530, 51.940],
        [15.520, 51.940],
        [15.520, 51.935]
      ]]
    }
  },
  {
    id: "block-03",
    name: "Wzgórze Chardonnay",
    area_ha: 15.00,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.540, 51.925],
        [15.550, 51.925],
        [15.550, 51.930],
        [15.540, 51.930],
        [15.540, 51.925]
      ]]
    }
  }
];

export function generateMockTimeSeries(blockId: string): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  // Create variations based on blockId
  const seed = blockId === 'block-01' ? 0.05 : blockId === 'block-02' ? -0.02 : 0.01;

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    // Realistic agricultural phenology curves for NDVI
    let ndvi = 0.2;
    if (i <= 12) {
      ndvi = 0.2 + Math.random() * 0.05 + seed * 0.2;
    } else if (i <= 21) {
      ndvi = 0.3 + (i - 12) * 0.04 + seed * 0.5;
    } else if (i <= 30) {
      ndvi = 0.75 + Math.random() * 0.1 + seed;
    } else if (i <= 34) {
      ndvi = 0.85 - (i - 30) * 0.15 + seed;
    } else {
      ndvi = 0.2 + Math.random() * 0.08 + seed * 0.2;
    }
    ndvi = Math.max(0.1, Math.min(0.95, ndvi));

    // Realistic moisture index curves for NDMI (water stress)
    let ndmi = 0.1;
    if (i <= 12) {
      ndmi = 0.1 + Math.random() * 0.03 + seed * 0.1;
    } else if (i <= 21) {
      ndmi = 0.15 + (i - 12) * 0.02 + seed * 0.3;
    } else if (i <= 30) {
      ndmi = 0.4 + Math.random() * 0.08 + seed * 0.5;
    } else if (i <= 34) {
      ndmi = 0.45 - (i - 30) * 0.06 + seed * 0.4;
    } else {
      ndmi = 0.12 + Math.random() * 0.04 + seed * 0.1;
    }
    ndmi = Math.max(-0.2, Math.min(0.85, ndmi));

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checks for valid Supabase configuration
  const hasSupabaseEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasSupabaseEnv) {
        console.warn('[GeoWorldLook] Supabase env variables missing — using mock vineyard data');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        if (data && data.features) {
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha || 0),
            geom: f.geometry,
            timeSeries: [] // Initialized empty, loaded on selection
          }));
          setBlocks(formattedBlocks);
        } else {
          // Fallback to mock blocks if table is empty
          setBlocks(MOCK_VINEYARD_BLOCKS);
        }
      } catch (err: any) {
        console.error('[GeoWorldLook] Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS); // Fallback to ensure stability
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasSupabaseEnv]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!hasSupabaseEnv) {
      return generateMockTimeSeries(blockId);
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return generateMockTimeSeries(blockId);
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`[GeoWorldLook] Error fetching stats for block ${blockId}:`, err);
      return generateMockTimeSeries(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
