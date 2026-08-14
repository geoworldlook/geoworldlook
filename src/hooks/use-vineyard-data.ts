'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardStat } from '@/types/vineyard';

// Zielona Góra, Poland coordinates approx [15.5, 51.9]
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1, // sequential numeric id used by MapLibre for feature state (hover)
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.50, 51.94],
            [15.52, 51.94],
            [15.52, 51.93],
            [15.50, 51.93],
            [15.50, 51.94]
          ]
        ]
      },
      properties: {
        id: 'block-1',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 4.5
      }
    },
    {
      type: 'Feature',
      id: 2,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.53, 51.93],
            [15.55, 51.93],
            [15.55, 51.92],
            [15.53, 51.92],
            [15.53, 51.93]
          ]
        ]
      },
      properties: {
        id: 'block-2',
        name: 'Parcela Süd Riesling',
        area_ha: 3.2
      }
    },
    {
      type: 'Feature',
      id: 3,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.47, 51.93],
            [15.49, 51.93],
            [15.49, 51.92],
            [15.47, 51.92],
            [15.47, 51.93]
          ]
        ]
      },
      properties: {
        id: 'block-3',
        name: 'Parcela West Chardonnay',
        area_ha: 5.1
      }
    }
  ]
};

function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-04-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const dateStr = d.toISOString().split('T')[0];
    const month = d.getMonth();

    // NDVI (0.15 to 0.85)
    let ndvi = 0.2;
    if (month >= 4 && month <= 7) {
      ndvi = 0.6 + Math.sin((month - 4) * Math.PI / 3) * 0.2 + Math.random() * 0.05;
    } else if (month === 3 || month === 8) {
      ndvi = 0.35 + Math.random() * 0.05;
    } else {
      ndvi = 0.18 + Math.random() * 0.04;
    }

    // NDMI (-0.2 to 0.6)
    let ndmi = -0.1;
    if (month >= 4 && month <= 7) {
      ndmi = 0.2 + Math.cos((month - 4) * Math.PI / 3) * 0.2 + Math.random() * 0.05;
    } else {
      ndmi = -0.05 + Math.random() * 0.05;
    }

    stats.push({
      block_id: blockId,
      date: dateStr,
      cloud_cover: Math.round(Math.random() * 15 + (month >= 10 || month <= 2 ? 15 : 0)),
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3))
    });
  }
  return stats;
}

export function useVineyardData() {
  const [blocksGeoJSON, setBlocksGeoJSON] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnv) {
        setBlocksGeoJSON(MOCK_BLOCKS_GEOJSON);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (error) throw error;

        setBlocksGeoJSON(data || MOCK_BLOCKS_GEOJSON);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks from Supabase:', err);
        setError(err.message);
        setBlocksGeoJSON(MOCK_BLOCKS_GEOJSON);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasEnv]);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!hasEnv) {
      return generateMockStats(blockId);
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return generateMockStats(blockId);
      }

      return data.map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId} from Supabase:`, err);
      return generateMockStats(blockId);
    }
  }

  return {
    blocksGeoJSON,
    loading,
    error,
    getBlockStats
  };
}
