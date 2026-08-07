'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing GIS vineyard polygon data from Supabase.
 * - Fetches vineyard blocks using get_vineyard_blocks_geojson RPC.
 * - Fetches historical NDVI/NDMI time-series statistics for a specific block.
 * - Seamlessly falls back to local mock data (for Zielona Góra, PL) on failure or when env vars are missing.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MOCK_BLOCKS: VineyardBlock[] = [
    {
      id: "block-zg-01",
      name: "Zielona Góra - Parcela Północna",
      area_ha: 12.45,
      geom: {
        type: "Polygon",
        coordinates: [
          [
            [15.500, 51.930],
            [15.515, 51.930],
            [15.515, 51.940],
            [15.500, 51.940],
            [15.500, 51.930]
          ]
        ]
      }
    },
    {
      id: "block-zg-02",
      name: "Zielona Góra - Parcela Południowa",
      area_ha: 8.30,
      geom: {
        type: "Polygon",
        coordinates: [
          [
            [15.520, 51.930],
            [15.535, 51.930],
            [15.535, 51.940],
            [15.520, 51.940],
            [15.520, 51.930]
          ]
        ]
      }
    }
  ];

  useEffect(() => {
    async function fetchBlocks() {
      // Explicitly check for the existence of Supabase environment variables before initializing client
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn('[GeoWorldLook] Supabase env vars missing — utilizing local mock vineyard blocks');
        setBlocks(MOCK_BLOCKS);
        setLoading(false); // Explicitly set loading to false in mock data branch
        return;
      }

      try {
        // Deferred client instantiation to avoid SSR problems
        const supabase = createClient();

        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (error) throw error;

        // Data is returned as a GeoJSON FeatureCollection from the RPC.
        // We map its features into our VineyardBlock typescript structure.
        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha || 0),
          geom: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock blocks
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return generateMockStats(blockId);
    }

    try {
      // Deferred client instantiation
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
      return generateMockStats(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}

/**
 * Generates continuous multi-year mock stats (2024 & 2025)
 * representing agricultural phenological cycles for fallback display.
 */
function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const years = [2024, 2025];
  const months = [5, 6, 7, 8, 9, 10]; // May to Oct

  years.forEach(year => {
    months.forEach((month, idx) => {
      [15, 28].forEach(day => {
        const monthRatio = idx / 5; // 0.0 to 1.0

        // NDVI curve: rises in summer, falls in autumn
        const ndviBase = 0.35 + Math.sin(monthRatio * Math.PI) * 0.42;
        const ndvi_mean = parseFloat((ndviBase + Math.random() * 0.05).toFixed(3));

        // NDMI curve: slightly drops during peak dry heat (July-August)
        const ndmiBase = 0.18 + Math.cos(monthRatio * Math.PI) * 0.14;
        const ndmi_mean = parseFloat((ndmiBase + Math.random() * 0.04).toFixed(3));

        const cloud_cover = parseFloat((Math.random() * 12).toFixed(1));

        stats.push({
          block_id: blockId,
          date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          cloud_cover,
          ndvi_mean,
          ndmi_mean
        });
      });
    });
  });

  return stats.sort((a, b) => a.date.localeCompare(b.date));
}
