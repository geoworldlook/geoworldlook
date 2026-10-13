'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Helper to generate mock time series data
function generateMockTimeSeries(): VineyardStats[] {
  const series: VineyardStats[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    let ndvi = 0.2;
    let ndmi = 0.1;

    if (i <= 12) {
      ndvi = 0.22 + Math.random() * 0.05;
      ndmi = 0.15 + Math.random() * 0.05;
    } else if (i <= 21) {
      ndvi = 0.35 + (i - 12) * 0.04 + Math.random() * 0.03;
      ndmi = 0.25 + (i - 12) * 0.03 + Math.random() * 0.03;
    } else if (i <= 30) {
      ndvi = 0.72 + Math.random() * 0.1;
      ndmi = 0.55 + Math.random() * 0.08;
    } else if (i <= 35) {
      ndvi = 0.82 - (i - 30) * 0.08;
      ndmi = 0.45 - (i - 30) * 0.06;
    } else {
      ndvi = 0.25 + Math.random() * 0.06;
      ndmi = 0.18 + Math.random() * 0.05;
    }

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 25)
    });
  }

  return series;
}

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    type: 'Feature',
    id: 'vb-zg-01',
    properties: {
      id: 'vb-zg-01',
      name: 'Parcela Nord Pinot Noir',
      area_ha: 4.25
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [15.5120, 51.9320],
        [15.5180, 51.9320],
        [15.5175, 51.9360],
        [15.5115, 51.9355],
        [15.5120, 51.9320]
      ]]
    }
  },
  {
    type: 'Feature',
    id: 'vb-zg-02',
    properties: {
      id: 'vb-zg-02',
      name: 'Parcela Sued Riesling',
      area_ha: 3.80
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [15.5200, 51.9300],
        [15.5260, 51.9295],
        [15.5255, 51.9335],
        [15.5195, 51.9340],
        [15.5200, 51.9300]
      ]]
    }
  },
  {
    type: 'Feature',
    id: 'vb-zg-03',
    properties: {
      id: 'vb-zg-03',
      name: 'Parcela Ouest Chardonnay',
      area_ha: 5.10
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [15.5030, 51.9340],
        [15.5090, 51.9345],
        [15.5085, 51.9385],
        [15.5025, 51.9380],
        [15.5030, 51.9340]
      ]]
    }
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        const features = data?.features || [];
        if (features.length === 0) {
          setBlocks(MOCK_BLOCKS);
        } else {
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            type: 'Feature',
            id: f.id || f.properties?.id,
            geometry: f.geometry,
            properties: {
              id: f.properties?.id || f.id,
              name: f.properties?.name || 'Działka Winnicy',
              area_ha: Number(f.properties?.area_ha || 0),
              created_at: f.properties?.created_at
            }
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.warn('Error fetching vineyard blocks from Supabase, using mock fallback:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return generateMockTimeSeries();
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return generateMockTimeSeries();
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err) {
      console.warn(`Error fetching stats for block ${blockId}, fallback to mock:`, err);
      return generateMockTimeSeries();
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
