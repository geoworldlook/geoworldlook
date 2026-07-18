'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Generate realistic mock stats for historical data
function generateMockStats(blockId: string): VineyardStats[] {
  const stats: VineyardStats[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const month = d.getMonth();

    // NDVI typical agricultural curve (peaks in summer)
    const ndviBase = month >= 5 && month <= 7 ? 0.75 : month >= 3 && month <= 8 ? 0.5 : 0.25;
    const ndvi = parseFloat((ndviBase + Math.random() * 0.1).toFixed(3));

    // NDMI typical moisture curve (lower in summer due to heat/stress)
    const ndmiBase = month >= 6 && month <= 8 ? 0.15 : 0.35;
    const ndmi = parseFloat((ndmiBase + Math.random() * 0.1).toFixed(3));

    stats.push({
      date: d.toISOString().split('T')[0],
      cloud_cover: Math.floor(Math.random() * 15),
      ndvi_mean: ndvi,
      ndmi_mean: ndmi
    });
  }
  return stats;
}

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.50,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.500, 51.900],
          [15.505, 51.900],
          [15.505, 51.905],
          [15.500, 51.905],
          [15.500, 51.900]
        ]
      ]
    }
  },
  {
    id: 'block-2',
    name: 'Parcela West Riesling',
    area_ha: 3.10,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.510, 51.900],
          [15.515, 51.900],
          [15.515, 51.905],
          [15.510, 51.905],
          [15.510, 51.900]
        ]
      ]
    }
  },
  {
    id: 'block-3',
    name: 'Parcela East Chardonnay',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.500, 51.910],
          [15.505, 51.910],
          [15.505, 51.915],
          [15.500, 51.915],
          [15.500, 51.910]
        ]
      ]
    }
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Explicitly check for environment variables
  const hasEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnv) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        // Deferred Supabase client instantiation
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // Map the FeatureCollection to VineyardBlock list
        const features = data?.features || [];
        const mappedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        // If returned features list is empty, default to mock blocks
        if (mappedBlocks.length === 0) {
          setBlocks(MOCK_BLOCKS);
        } else {
          setBlocks(mappedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks, falling back to mock data:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, [hasEnv]);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!hasEnv) {
      return generateMockStats(blockId);
    }

    try {
      // Deferred Supabase client instantiation
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
      console.error(`Error fetching stats for block ${blockId}, falling back to mock:`, err);
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
