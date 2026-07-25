'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // geojson coordinates/geometry
}

export interface VineyardStat {
  block_id: string;
  date: string;
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

// Mock GeoJSON FeatureCollection in Zielona Góra region, Poland (approx [15.5, 51.9])
const MOCK_BLOCKS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "block-zg-01",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.50, 51.90],
            [15.54, 51.90],
            [15.54, 51.92],
            [15.50, 51.92],
            [15.50, 51.90]
          ]
        ]
      },
      properties: {
        id: "block-zg-01",
        name: "Winnica Zielona Góra - Sektor A",
        area_ha: 12.5
      }
    },
    {
      type: "Feature",
      id: "block-zg-02",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.55, 51.90],
            [15.59, 51.90],
            [15.59, 51.92],
            [15.55, 51.92],
            [15.55, 51.90]
          ]
        ]
      },
      properties: {
        id: "block-zg-02",
        name: "Winnica Zielona Góra - Sektor B",
        area_ha: 8.3
      }
    }
  ]
};

// Generates simulated NDVI and NDMI curves over 12 months in 2025
function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const dateStr = d.toISOString().split('T')[0];

    const month = d.getMonth();
    // Peak in summer (May - September)
    const baseNdvi = month >= 4 && month <= 8 ? 0.65 : 0.25;
    const ndvi_mean = baseNdvi + Math.random() * 0.15;

    // NDMI (moisture index) is slightly lower in peak dry summer (June - August)
    const baseNdmi = month >= 5 && month <= 7 ? 0.15 : 0.35;
    const ndmi_mean = baseNdmi + Math.random() * 0.12;

    stats.push({
      block_id: blockId,
      date: dateStr,
      cloud_cover: parseFloat((Math.random() * 12).toFixed(1)),
      ndvi_mean: parseFloat(ndvi_mean.toFixed(3)),
      ndmi_mean: parseFloat(ndmi_mean.toFixed(3))
    });
  }
  return stats;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Defer client instantiation to fetching functions to avoid runtime/SSR errors
  const getSupabaseClient = () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }
    try {
      return createClient();
    } catch (e) {
      console.error('[useVineyardData] Failed to initialize Supabase client:', e);
      return null;
    }
  };

  useEffect(() => {
    async function fetchBlocks() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn('[useVineyardData] Supabase configuration is missing or invalid. Falling back to local mock data.');
        setBlocks(MOCK_BLOCKS_GEOJSON.features);
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (rpcError) throw rpcError;

        if (data && data.features && data.features.length > 0) {
          setBlocks(data.features);
        } else {
          console.warn('[useVineyardData] No vineyard blocks found in database. Using mock data fallback.');
          setBlocks(MOCK_BLOCKS_GEOJSON.features);
        }
      } catch (err: any) {
        console.error('[useVineyardData] Database error fetching blocks:', err);
        setError(err.message);
        // Fallback to mock data to ensure robustness
        setBlocks(MOCK_BLOCKS_GEOJSON.features);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return generateMockStats(blockId);
    }

    try {
      const { data, error: queryError } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (queryError) throw queryError;

      if (data && data.length > 0) {
        return data.map((d: any) => ({
          block_id: d.block_id,
          date: d.date,
          cloud_cover: Number(d.cloud_cover),
          ndvi_mean: Number(d.ndvi_mean),
          ndmi_mean: Number(d.ndmi_mean),
        }));
      } else {
        return generateMockStats(blockId);
      }
    } catch (err: any) {
      console.error(`[useVineyardData] Error fetching stats for block ${blockId}:`, err);
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
