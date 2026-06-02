
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        console.warn('Using mock vineyard data');
        setBlocks([
          {
            id: 'mock-1',
            name: 'Zielona Góra - Parcela A',
            area_ha: 2.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
            },
            stats: []
          }
        ]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (error) throw error;

        const formattedBlocks: VineyardBlock[] = (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          area_ha: Number(b.area_ha),
          geom: b.geom,
          stats: []
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return [
        { date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.4, ndmi_mean: 0.2 },
        { date: '2024-02-01', cloud_cover: 20, ndvi_mean: 0.5, ndmi_mean: 0.3 },
        { date: '2024-03-01', cloud_cover: 5, ndvi_mean: 0.7, ndmi_mean: 0.5 },
      ];
    }

    try {
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
