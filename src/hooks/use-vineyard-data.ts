
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MOCK DATA for local development when Supabase is not connected
  const MOCK_BLOCKS: VineyardBlock[] = [
    {
      id: 'mock-1',
      name: 'Parcela Nord Nebbiolo',
      area_ha: 2.45,
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
    }
  ];

  const MOCK_STATS: VineyardStat[] = Array.from({ length: 12 }).map((_, i) => ({
    date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
    ndvi_mean: 0.3 + Math.random() * 0.5,
    ndmi_mean: 0.1 + Math.random() * 0.4,
    cloud_cover: Math.random() * 20
  }));

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // data is a GeoJSON FeatureCollection
        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));

        setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_BLOCKS);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS);
        // We don't set error here to allow mock data to show up
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) return MOCK_STATS;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS;
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
