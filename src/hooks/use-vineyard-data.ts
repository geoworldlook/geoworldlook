
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/database.types';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.error('Error fetching via RPC, falling back to table:', error);
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('*');

          if (tableError) throw tableError;
          setBlocks(tableData || []);
        } else {
          setBlocks(data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return MOCK_STATS.filter(s => s.block_id === blockId);
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
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

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'mock-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
    },
    created_at: new Date().toISOString()
  }
];

const MOCK_STATS: VineyardStat[] = [
  {
    block_id: 'mock-1',
    date: '2024-01-01',
    cloud_cover: 10,
    ndvi_mean: 0.45,
    ndmi_mean: 0.15
  },
  {
    block_id: 'mock-1',
    date: '2024-02-01',
    cloud_cover: 5,
    ndvi_mean: 0.48,
    ndmi_mean: 0.18
  },
  {
    block_id: 'mock-1',
    date: '2024-03-01',
    cloud_cover: 20,
    ndvi_mean: 0.55,
    ndmi_mean: 0.25
  },
  {
    block_id: 'mock-1',
    date: '2024-04-01',
    cloud_cover: 15,
    ndvi_mean: 0.62,
    ndmi_mean: 0.30
  },
  {
    block_id: 'mock-1',
    date: '2024-05-01',
    cloud_cover: 8,
    ndvi_mean: 0.75,
    ndmi_mean: 0.42
  }
];
