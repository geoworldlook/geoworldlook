
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when Supabase is not connected
const MOCK_BLOCKS: any = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'mock-1',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.500, 51.900], [15.510, 51.900], [15.510, 51.910], [15.500, 51.910], [15.500, 51.900]]]
      },
      properties: {
        id: 'mock-1',
        name: 'Zielona Góra North',
        area_ha: 12.5
      }
    },
    {
      type: 'Feature',
      id: 'mock-2',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.520, 51.920], [15.530, 51.920], [15.530, 51.930], [15.520, 51.930], [15.520, 51.920]]]
      },
      properties: {
        id: 'mock-2',
        name: 'Zielona Góra South',
        area_ha: 8.2
      }
    }
  ]
};

const MOCK_STATS: VineyardStat[] = [
  { date: '2023-05-01', ndvi_mean: 0.45, ndmi_mean: 0.2, cloud_cover: 5 },
  { date: '2023-06-01', ndvi_mean: 0.65, ndmi_mean: 0.3, cloud_cover: 10 },
  { date: '2023-07-01', ndvi_mean: 0.75, ndmi_mean: 0.25, cloud_cover: 2 },
  { date: '2023-08-01', ndvi_mean: 0.70, ndmi_mean: 0.15, cloud_cover: 15 },
  { date: '2023-09-01', ndvi_mean: 0.55, ndmi_mean: 0.1, cloud_cover: 20 },
];

export function useVineyardData() {
  const [blocksGeoJson, setBlocksGeoJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('Supabase error, using mock data:', error);
          setBlocksGeoJson(MOCK_BLOCKS);
        } else {
          setBlocksGeoJson(data);
        }
      } catch (err: any) {
        console.warn('Fetch error, using mock data:', err);
        setBlocksGeoJson(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (blockId.startsWith('mock-')) {
      return MOCK_STATS;
    }

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
      return [];
    }
  }

  return {
    blocksGeoJson,
    loading,
    error,
    getBlockStats
  };
}
