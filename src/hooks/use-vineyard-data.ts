
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when database might not be ready or empty
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.930],
        [15.505, 51.930],
        [15.505, 51.935],
        [15.500, 51.935],
        [15.500, 51.930]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'block-2',
    name: 'Sektor Południowy Riesling',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.925],
        [15.515, 51.925],
        [15.515, 51.930],
        [15.510, 51.930],
        [15.510, 51.925]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom, created_at');

        if (error) {
            console.warn('Database error or missing tables, falling back to mock data:', error);
            setBlocks(MOCK_BLOCKS);
            return;
        }

        if (!data || data.length === 0) {
            setBlocks(MOCK_BLOCKS);
        } else {
            setBlocks(data);
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
      // Return mock stats if it's a mock block
      if (blockId.startsWith('block-')) {
          return generateMockStats(blockId);
      }
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

function generateMockStats(blockId: string): VineyardStat[] {
    const stats: VineyardStat[] = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        stats.push({
            block_id: blockId,
            date: date.toISOString().split('T')[0],
            cloud_cover: Math.random() * 20,
            ndvi_mean: 0.4 + Math.random() * 0.4,
            ndmi_mean: 0.2 + Math.random() * 0.3
        });
    }
    return stats;
}
