'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Mock polygon coordinates for Zielona Góra, Poland region.
// Polish vineyard blocks:
// 1. Winnica Winnogóra - Parcela A (approx center [15.54, 51.93])
// 2. Winnica Winnogóra - Parcela B (approx center [15.55, 51.93])
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-zg-01',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.535, 51.928],
          [15.545, 51.928],
          [15.545, 51.932],
          [15.535, 51.932],
          [15.535, 51.928]
        ]]
      },
      properties: {
        id: 'block-zg-01',
        name: 'Winnogóra Parcela Południowa',
        area_ha: 4.25
      }
    },
    {
      type: 'Feature',
      id: 'block-zg-02',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.546, 51.928],
          [15.556, 51.928],
          [15.556, 51.932],
          [15.546, 51.932],
          [15.546, 51.928]
        ]]
      },
      properties: {
        id: 'block-zg-02',
        name: 'Winnogóra Parcela Północna',
        area_ha: 3.80
      }
    }
  ]
};

// Generates simulated historical index curve over 2 years (multi-year)
function generateMultiYearTimeSeries(blockId: string): VineyardStats[] {
  const series: VineyardStats[] = [];
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 104; i++) { // 104 weeks ~ 2 years
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 7);

    // Simulate seasonal agricultural curve
    const weekIndex = i % 52;
    let ndviBase = 0.2;
    let ndmiBase = 0.1;

    if (weekIndex >= 12 && weekIndex <= 21) {
      // Growth phase
      ndviBase = 0.2 + (weekIndex - 12) * 0.05;
      ndmiBase = 0.1 + (weekIndex - 12) * 0.04;
    } else if (weekIndex > 21 && weekIndex <= 32) {
      // Peak phase
      ndviBase = 0.7 + Math.random() * 0.1;
      ndmiBase = 0.5 + Math.random() * 0.1;
    } else if (weekIndex > 32 && weekIndex <= 38) {
      // Harvest decline
      ndviBase = 0.7 - (weekIndex - 32) * 0.08;
      ndmiBase = 0.5 - (weekIndex - 32) * 0.07;
    } else {
      // Dormancy
      ndviBase = 0.15 + Math.random() * 0.05;
      ndmiBase = 0.05 + Math.random() * 0.05;
    }

    series.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(Math.min(1, Math.max(-1, ndviBase)).toFixed(3)),
      ndmi_mean: parseFloat(Math.min(1, Math.max(-1, ndmiBase)).toFixed(3)),
      cloud_cover: parseFloat((Math.random() * 15).toFixed(1))
    });
  }
  return series;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      // Check if Supabase environment variables are present
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn('[GeoWorldLook] Supabase env variables missing. Falling back to mock vineyard blocks.');
        const formattedBlocks: VineyardBlock[] = MOCK_BLOCKS_GEOJSON.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          timeSeries: generateMultiYearTimeSeries(f.properties.id)
        }));
        setBlocks(formattedBlocks);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch blocks using the get_vineyard_blocks_geojson() RPC
        const { data: geojsonResult, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        const features = geojsonResult?.features || [];

        // Fetch historical statistics for all blocks
        const { data: statsData, error: statsError } = await supabase
          .from('vineyard_stats')
          .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
          .order('date', { ascending: true });

        if (statsError) throw statsError;

        const statsMap: Record<string, VineyardStats[]> = {};
        (statsData || []).forEach((s: any) => {
          if (!statsMap[s.block_id]) {
            statsMap[s.block_id] = [];
          }
          statsMap[s.block_id].push({
            block_id: s.block_id,
            date: s.date,
            cloud_cover: Number(s.cloud_cover),
            ndvi_mean: Number(s.ndvi_mean),
            ndmi_mean: Number(s.ndmi_mean)
          });
        });

        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry,
          timeSeries: statsMap[f.properties.id] || []
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('[GeoWorldLook] Error fetching vineyard blocks:', err);
        setError(err.message);

        // Recover with mock data on failure
        const formattedBlocks: VineyardBlock[] = MOCK_BLOCKS_GEOJSON.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          timeSeries: generateMultiYearTimeSeries(f.properties.id)
        }));
        setBlocks(formattedBlocks);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    const matched = blocks.find(b => b.id === blockId);
    if (matched) return matched.timeSeries;

    // Supabase fallback query if block is not loaded (or if we need a direct refetch)
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return generateMultiYearTimeSeries(blockId);
    }

    try {
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
