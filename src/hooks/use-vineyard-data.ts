'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Realistic mock vineyard blocks representing Zielona Góra region in Poland (approx [15.5, 51.9])
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-1",
    name: "Parcela Północna Chardonnay",
    area_ha: 4.20,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.501, 51.931],
          [15.505, 51.931],
          [15.505, 51.935],
          [15.501, 51.935],
          [15.501, 51.931]
        ]
      ]
    }
  },
  {
    id: "block-2",
    name: "Parcela Zachodnia Pinot Noir",
    area_ha: 3.50,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.511, 51.931],
          [15.515, 51.931],
          [15.515, 51.935],
          [15.511, 51.935],
          [15.511, 51.931]
        ]
      ]
    }
  },
  {
    id: "block-3",
    name: "Parcela Wschodnia Riesling",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.506, 51.936],
          [15.510, 51.936],
          [15.510, 51.940],
          [15.506, 51.940],
          [15.506, 51.936]
        ]
      ]
    }
  }
];

// Generates weekly stats covering multiple calendar years
function generateMockStatsForBlock(blockId: string): VineyardStats[] {
  const stats: VineyardStats[] = [];
  const start = new Date('2024-01-01');

  // 104 weeks is exactly 2 years of data
  for (let i = 0; i < 104; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth();

    // Simulates a realistic seasonal NDVI curve
    let ndvi = 0.20;
    if (month >= 3 && month <= 9) { // April to October
      const angle = ((month - 3) / 6) * Math.PI;
      ndvi = 0.25 + 0.55 * Math.sin(angle) + Math.random() * 0.05;
    } else {
      ndvi = 0.15 + Math.random() * 0.05;
    }

    // Simulates a realistic NDMI curve (usually drops slightly in peak summer dryness)
    let ndmi = 0.10;
    if (month >= 5 && month <= 7) { // June to August
      ndmi = -0.15 + Math.random() * 0.1;
    } else {
      ndmi = 0.10 + Math.random() * 0.15;
    }

    stats.push({
      date: dateStr,
      cloud_cover: Math.floor(Math.random() * 15),
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3))
    });
  }
  return stats;
}

/**
 * Custom hook for managing GIS vineyard block data from Supabase.
 * - Fetches vineyard blocks as GeoJSON using RPC function.
 * - Fetches historical NDVI and NDMI stats.
 * - Falls back cleanly to local mock data if environment variables are missing.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Supabase env vars are set
  const hasEnvVars =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnvVars) {
        console.warn('[GeoWorldLook] Supabase env vars missing — falling back to mock vineyard blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // Map RPC GeoJSON FeatureCollection to VineyardBlock type
        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id || f.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks from Supabase:', err);
        setError(err.message);
        // Resilient fallback to mock blocks
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasEnvVars]);

  /**
   * Fetches the historical stats for a specific vineyard block.
   */
  const getBlockStats = useCallback(async (blockId: string): Promise<VineyardStats[]> => {
    if (!hasEnvVars) {
      return generateMockStatsForBlock(blockId);
    }

    try {
      const supabase = createClient();
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
      // Resilient fallback to mock stats
      return generateMockStatsForBlock(blockId);
    }
  }, [hasEnvVars]);

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
