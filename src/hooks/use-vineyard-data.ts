'use client';

import { useState, useEffect } from 'react';
import { VineyardStat } from '@/types/vineyard';

// Zielona Góra mock data coordinates representing Poland (approx [15.5, 51.9])
const MOCK_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "block-zg-01",
        name: "Parcela Winna Góra",
        area_ha: 4.5
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.50, 51.93],
            [15.51, 51.93],
            [15.51, 51.94],
            [15.50, 51.94],
            [15.50, 51.93]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "block-zg-02",
        name: "Parcela Zachodnia",
        area_ha: 3.2
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.48, 51.92],
            [15.49, 51.92],
            [15.49, 51.93],
            [15.48, 51.93],
            [15.48, 51.92]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "block-zg-03",
        name: "Parcela Południowa",
        area_ha: 5.1
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15.52, 51.91],
            [15.53, 51.91],
            [15.53, 51.92],
            [15.52, 51.92],
            [15.52, 51.91]
          ]
        ]
      }
    }
  ]
};

function generateMockStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2025-01-01');
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 15);

    // Seasonal curves for Poland
    const month = d.getMonth();
    let ndvi = 0.25 + Math.random() * 0.05;
    let ndmi = 0.05 + Math.random() * 0.05;
    if (month >= 3 && month <= 8) { // April-September (growth peak in July/August)
      ndvi += (month - 2) * 0.08;
      ndmi += (month - 2) * 0.04;
    } else if (month > 8) {
      ndvi += (11 - month) * 0.08;
      ndmi += (11 - month) * 0.04;
    }

    stats.push({
      date: d.toISOString().split('T')[0],
      cloud_cover: parseFloat((Math.random() * 15).toFixed(1)),
      ndvi_mean: parseFloat(Math.min(0.9, Math.max(0.1, ndvi)).toFixed(3)),
      ndmi_mean: parseFloat(Math.min(0.6, Math.max(-0.2, ndmi)).toFixed(3))
    });
  }
  return stats;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!hasEnv) {
        console.warn('Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (error) throw error;
        setBlocks(data || { type: 'FeatureCollection', features: [] });
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv || blockId.startsWith('block-')) {
      return generateMockStats();
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
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
      return generateMockStats();
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
