
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for local development
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geometry: {
      type: 'Polygon',
      coordinates: [[[6.14, 46.20], [6.15, 46.20], [6.15, 46.21], [6.14, 46.21], [6.14, 46.20]]]
    }
  },
  {
    id: 'block-2',
    name: 'Parcela Sud Sangiovese',
    area_ha: 3.8,
    geometry: {
      type: 'Polygon',
      coordinates: [[[6.16, 46.22], [6.17, 46.22], [6.17, 46.23], [6.16, 46.23], [6.16, 46.22]]]
    }
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': Array.from({ length: 12 }, (_, i) => ({
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
    cloud_cover: Math.random() * 20,
    ndvi_mean: 0.4 + Math.random() * 0.4,
    ndmi_mean: 0.1 + Math.random() * 0.3
  })),
  'block-2': Array.from({ length: 12 }, (_, i) => ({
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
    cloud_cover: Math.random() * 20,
    ndvi_mean: 0.3 + Math.random() * 0.5,
    ndmi_mean: 0.0 + Math.random() * 0.4
  }))
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
          console.warn('Supabase URL missing, using mock vineyard data');
          setBlocks(MOCK_BLOCKS);
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        if (!data || data.length === 0) {
          setBlocks(MOCK_BLOCKS);
        } else {
          setBlocks(data.map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geometry: b.geom // Assuming PostGIS geom returns GeoJSON-like structure or needs parsing
          })));
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return MOCK_STATS[blockId] || [];
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
