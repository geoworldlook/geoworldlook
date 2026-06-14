
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for fallback
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.532, 51.942], [15.538, 51.942], [15.538, 51.945], [15.532, 51.945], [15.532, 51.942]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Parcela Północna - Riesling (Mock)',
        area_ha: 2.45
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.531, 51.936], [15.537, 51.936], [15.537, 51.939], [15.531, 51.939], [15.531, 51.936]]]
      },
      properties: {
        id: 'mock-2',
        name: 'Parcela Południowa - Pinot Noir (Mock)',
        area_ha: 1.82
      }
    }
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
           console.warn('Using mock blocks due to RPC error:', error);
           setBlocks(MOCK_BLOCKS);
        } else {
           setBlocks(data);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Return some mock stats if no data found
        return generateMockStats(blockId);
      }

      return data.map((d: any) => ({
        block_id: blockId,
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
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

function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: 0.1 + Math.random() * 0.4,
      cloud_cover: Math.random() * 20
    });
  }
  return stats;
}
