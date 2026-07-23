'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard';

// Mock GeoJSON coordinates around Zielona Góra, Poland [15.5, 51.9]
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.500, 51.930],
            [15.515, 51.930],
            [15.515, 51.940],
            [15.500, 51.940],
            [15.500, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-zg-01',
        name: 'Zielona Gora - Parcela Polnoc',
        area_ha: 12.50
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.520, 51.930],
            [15.535, 51.930],
            [15.535, 51.940],
            [15.520, 51.940],
            [15.520, 51.930]
          ]
        ]
      },
      properties: {
        id: 'block-zg-02',
        name: 'Zielona Gora - Parcela Poludnie',
        area_ha: 8.75
      }
    }
  ]
};

function generateAgriCurve(weekIndex: number, isNdmi: boolean = false): number {
  if (isNdmi) {
    // NDMI curve (high in spring, drops in mid-summer, rises in autumn)
    if (weekIndex <= 12) return 0.4 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.5 - (weekIndex - 12) * 0.01 + Math.random() * 0.05;
    if (weekIndex <= 30) return 0.2 + Math.random() * 0.08; // summer moisture stress
    if (weekIndex <= 34) return 0.3 + (weekIndex - 30) * 0.04 + Math.random() * 0.05;
    return 0.45 + Math.random() * 0.05;
  } else {
    // NDVI curve (low in winter/early spring, peaks in mid-summer)
    if (weekIndex <= 12) return 0.15 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.2 + (weekIndex - 12) * 0.05;
    if (weekIndex <= 30) return 0.7 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.8 - (weekIndex - 30) * 0.1;
    return 0.2 + Math.random() * 0.05;
  }
}

function generateTimeSeries(blockId: string): VineyardBlockStats[] {
  const series: VineyardBlockStats[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, false).toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, true).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 15)
    });
  }
  return series;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnv) {
        console.warn('[GeoWorldLook] Supabase credentials missing — using mock vineyard data');
        const formatted = MOCK_BLOCKS_GEOJSON.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));
        setBlocks(formatted);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        const featureCollection = data as any;
        const features = featureCollection?.features || [];

        const formatted: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        setBlocks(formatted);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock on error
        const formatted = MOCK_BLOCKS_GEOJSON.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));
        setBlocks(formatted);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasEnv]);

  async function getVineyardStats(blockId: string): Promise<VineyardBlockStats[]> {
    if (!hasEnv) {
      return generateTimeSeries(blockId);
    }

    try {
      const supabase = createClient();
      const { data, error: statsError } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (statsError) throw statsError;

      if (!data || data.length === 0) {
        return generateTimeSeries(blockId);
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return generateTimeSeries(blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getVineyardStats
  };
}
