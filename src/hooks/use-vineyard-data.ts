
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
      try {
        // We use an RPC call that we'll define in the migration to get GeoJSON directly
        const { data, error } = await supabase.rpc('get_blocks_geojson');

        if (error) {
          console.warn('RPC get_blocks_geojson failed, falling back to mock data:', error);
          setBlocks(MOCK_BLOCKS);
          return;
        }

        if (!data || data.length === 0) {
          setBlocks(MOCK_BLOCKS);
          return;
        }

        const formattedBlocks: VineyardBlock[] = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          area_ha: b.area_ha,
          geometry: b.geom // This should be the GeoJSON geometry object
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
        setError(err.message);
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

      if (error || !data || data.length === 0) {
        // Return mock stats if not found
        return generateMockStats();
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
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

// --- Mock Data ---

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [6.48, 46.53],
        [6.49, 46.53],
        [6.49, 46.54],
        [6.48, 46.54],
        [6.48, 46.53]
      ]]
    }
  },
  {
    id: 'mock-block-2',
    name: 'South Slope Chardonnay',
    area_ha: 1.8,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [6.50, 46.53],
        [6.51, 46.53],
        [6.51, 46.54],
        [6.50, 46.54],
        [6.50, 46.53]
      ]]
    }
  }
];

function generateMockStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: 0.1 + Math.random() * 0.4,
      cloud_cover: Math.random() * 20
    });
  }
  return stats;
}
