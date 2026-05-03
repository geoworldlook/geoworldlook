
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not configured
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Sector Nord - Pinot Noir',
    area_ha: 4.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'Sector South - Riesling',
    area_ha: 3.2,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.910],
        [15.515, 51.910],
        [15.515, 51.915],
        [15.510, 51.915],
        [15.510, 51.910]
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
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase env vars missing — using mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        // Try to call RPC first
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC failed, falling back to direct table fetch or mock:', error.message);

          // Fallback to direct fetch if RPC is not available yet
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha');

          if (tableError || !tableData || tableData.length === 0) {
             setBlocks(MOCK_BLOCKS);
          } else {
             setBlocks(tableData.map(b => ({
               id: b.id,
               name: b.name,
               area_ha: b.area_ha,
               geom: null // Geometry might not be easily selectable without PostGIS functions
             })));
          }
        } else {
          setBlocks(data.map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: b.area_ha,
            geom: b.geom_json
          })));
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
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return generateMockStats();
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        // Return some dummy stats for mock blocks
        return generateMockStats();
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
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

function generateMockStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i / 2);
    stats.push({
      date: d.toISOString().split('T')[0],
      cloud_cover: Math.random() * 20,
      ndvi_mean: 0.2 + Math.random() * 0.6,
      ndmi_mean: 0.1 + Math.random() * 0.4
    });
  }
  return stats;
}
