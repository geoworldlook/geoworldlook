
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock data for development when database tables are not yet filled
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.520, 51.930],
        [15.525, 51.930],
        [15.525, 51.935],
        [15.520, 51.935],
        [15.520, 51.930]
      ]]
    },
    stats: []
  },
  {
    id: 'block-2',
    name: 'South Slope Chardonnay',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.530, 51.925],
        [15.535, 51.925],
        [15.535, 51.930],
        [15.530, 51.930],
        [15.530, 51.925]
      ]]
    },
    stats: []
  }
];

const MOCK_STATS: Record<string, VineyardStat[]> = {
  'block-1': [
    { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
    { date: '2024-02-01', ndvi_mean: 0.25, ndmi_mean: 0.15, cloud_cover: 20 },
    { date: '2024-03-01', ndvi_mean: 0.4, ndmi_mean: 0.3, cloud_cover: 5 },
    { date: '2024-04-01', ndvi_mean: 0.6, ndmi_mean: 0.5, cloud_cover: 0 },
    { date: '2024-05-01', ndvi_mean: 0.75, ndmi_mean: 0.65, cloud_cover: 15 },
  ],
  'block-2': [
    { date: '2024-01-01', ndvi_mean: 0.15, ndmi_mean: 0.05, cloud_cover: 12 },
    { date: '2024-02-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 25 },
    { date: '2024-03-01', ndvi_mean: 0.35, ndmi_mean: 0.25, cloud_cover: 8 },
    { date: '2024-04-01', ndvi_mean: 0.55, ndmi_mean: 0.45, cloud_cover: 2 },
    { date: '2024-05-01', ndvi_mean: 0.7, ndmi_mean: 0.6, cloud_cover: 10 },
  ]
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEnvVars =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    async function fetchBlocks() {
      if (!hasEnvVars) {
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      try {
        // Try to call the RPC function we created in the migration
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC failed, falling back to direct table fetch or mock data:', error);

          // Fallback to direct fetch
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (tableError || !tableData || tableData.length === 0) {
            setBlocks(MOCK_BLOCKS);
          } else {
             // Basic mapping if geom is returned as WKB/string (this might need ST_AsGeoJSON in the query if not using RPC)
             setBlocks(tableData.map(b => ({
               ...b,
               geom: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom,
               stats: []
             })));
          }
        } else {
          // RPC returns the whole FeatureCollection
          const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry,
            stats: []
          }));
          setBlocks(formattedBlocks.length > 0 ? formattedBlocks : MOCK_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setBlocks(MOCK_BLOCKS); // Final fallback
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    if (!hasEnvVars) {
      return MOCK_STATS[blockId] || [];
    }

    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_STATS[blockId] || [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
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
