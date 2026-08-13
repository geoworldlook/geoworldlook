'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface VineyardStat {
  date: string; // YYYY-MM-DD
  cloud_cover: number;
  ndvi_mean: number;
  ndmi_mean: number;
}

export interface VineyardBlock {
  id: string;
  name: string;
  area_ha: number;
  geom: any; // Can be a GeoJSON Polygon object or PostGIS geometry representation
  stats: VineyardStat[];
}

// Zielona Góra region mock polygons and historical statistics
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: 'b1111111-2222-3333-4444-555555555555',
    name: 'Parcela Nord Nebbiolo (Zielona Góra)',
    area_ha: 2.45,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.4950, 51.9300],
          [15.5050, 51.9300],
          [15.5050, 51.9350],
          [15.4950, 51.9350],
          [15.4950, 51.9300]
        ]
      ]
    },
    stats: [
      { date: '2025-01-15', cloud_cover: 35.2, ndvi_mean: 0.12, ndmi_mean: 0.05 },
      { date: '2025-02-18', cloud_cover: 28.1, ndvi_mean: 0.15, ndmi_mean: 0.07 },
      { date: '2025-03-20', cloud_cover: 15.4, ndvi_mean: 0.28, ndmi_mean: 0.12 },
      { date: '2025-04-12', cloud_cover: 8.5, ndvi_mean: 0.42, ndmi_mean: 0.22 },
      { date: '2025-05-25', cloud_cover: 12.1, ndvi_mean: 0.58, ndmi_mean: 0.35 },
      { date: '2025-06-14', cloud_cover: 5.0, ndvi_mean: 0.72, ndmi_mean: 0.48 },
      { date: '2025-07-22', cloud_cover: 19.3, ndvi_mean: 0.78, ndmi_mean: 0.42 },
      { date: '2025-08-18', cloud_cover: 10.2, ndvi_mean: 0.74, ndmi_mean: 0.31 },
      { date: '2025-09-15', cloud_cover: 22.4, ndvi_mean: 0.61, ndmi_mean: 0.25 },
      { date: '2025-10-10', cloud_cover: 30.5, ndvi_mean: 0.45, ndmi_mean: 0.18 },
      { date: '2025-11-05', cloud_cover: 40.0, ndvi_mean: 0.28, ndmi_mean: 0.10 },
      { date: '2025-12-12', cloud_cover: 38.2, ndvi_mean: 0.18, ndmi_mean: 0.06 }
    ]
  },
  {
    id: 'b2222222-3333-4444-5555-666666666666',
    name: 'Wzgórze Cabernet Sauvignon',
    area_ha: 1.80,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.5100, 51.9280],
          [15.5200, 51.9280],
          [15.5200, 51.9330],
          [15.5100, 51.9330],
          [15.5100, 51.9280]
        ]
      ]
    },
    stats: [
      { date: '2025-01-15', cloud_cover: 32.0, ndvi_mean: 0.10, ndmi_mean: 0.04 },
      { date: '2025-02-18', cloud_cover: 25.0, ndvi_mean: 0.13, ndmi_mean: 0.06 },
      { date: '2025-03-20', cloud_cover: 12.0, ndvi_mean: 0.25, ndmi_mean: 0.11 },
      { date: '2025-04-12', cloud_cover: 5.0, ndvi_mean: 0.38, ndmi_mean: 0.20 },
      { date: '2025-05-25', cloud_cover: 10.0, ndvi_mean: 0.52, ndmi_mean: 0.30 },
      { date: '2025-06-14', cloud_cover: 3.0, ndvi_mean: 0.68, ndmi_mean: 0.44 },
      { date: '2025-07-22', cloud_cover: 15.0, ndvi_mean: 0.74, ndmi_mean: 0.38 },
      { date: '2025-08-18', cloud_cover: 8.0, ndvi_mean: 0.70, ndmi_mean: 0.28 },
      { date: '2025-09-15', cloud_cover: 20.0, ndvi_mean: 0.58, ndmi_mean: 0.22 },
      { date: '2025-10-10', cloud_cover: 28.0, ndvi_mean: 0.40, ndmi_mean: 0.15 },
      { date: '2025-11-05', cloud_cover: 35.0, ndvi_mean: 0.24, ndmi_mean: 0.08 },
      { date: '2025-12-12', cloud_cover: 36.0, ndvi_mean: 0.15, ndmi_mean: 0.05 }
    ]
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      // Defer client initialization until inside fetch function
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn('[GeoWorldLook] Supabase credentials missing, falling back to local mock data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Fetch blocks using standard table select or get_vineyard_blocks_geojson RPC if available
        const { data: geojsonResponse, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) {
          console.warn('[GeoWorldLook] RPC failed, trying direct select fallback:', rpcError.message);

          const { data: directBlocks, error: directError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (directError) throw directError;

          // Hydrate blocks from direct select
          const hydrated: VineyardBlock[] = [];
          for (const b of (directBlocks || [])) {
            const { data: statsData } = await supabase
              .from('vineyard_stats')
              .select('date, cloud_cover, ndvi_mean, ndmi_mean')
              .eq('block_id', b.id)
              .order('date', { ascending: true });

            hydrated.push({
              id: b.id,
              name: b.name,
              area_ha: Number(b.area_ha),
              geom: b.geom, // Might need parsing depending on PostGIS representation
              stats: (statsData || []).map((s: any) => ({
                date: s.date,
                cloud_cover: Number(s.cloud_cover),
                ndvi_mean: Number(s.ndvi_mean),
                ndmi_mean: Number(s.ndmi_mean)
              }))
            });
          }
          setBlocks(hydrated);
        } else {
          // If RPC succeeded, parsing GeoJSON FeatureCollection
          const features = geojsonResponse?.features || [];
          const hydrated: VineyardBlock[] = [];

          for (const f of features) {
            const blockId = f.properties.id;
            const { data: statsData } = await supabase
              .from('vineyard_stats')
              .select('date, cloud_cover, ndvi_mean, ndmi_mean')
              .eq('block_id', blockId)
              .order('date', { ascending: true });

            hydrated.push({
              id: blockId,
              name: f.properties.name,
              area_ha: Number(f.properties.area_ha),
              geom: f.geometry,
              stats: (statsData || []).map((s: any) => ({
                date: s.date,
                cloud_cover: Number(s.cloud_cover),
                ndvi_mean: Number(s.ndvi_mean),
                ndmi_mean: Number(s.ndmi_mean)
              }))
            });
          }
          setBlocks(hydrated);
        }
      } catch (err: any) {
        console.error('[GeoWorldLook] Error loading vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data in case of error
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const existing = blocks.find(b => b.id === blockId);
    if (existing && existing.stats && existing.stats.length > 0) {
      return existing.stats;
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const mock = MOCK_BLOCKS.find(b => b.id === blockId);
      return mock ? mock.stats : [];
    }

    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (err) throw err;

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (e) {
      console.error(`[GeoWorldLook] Error loading stats for block ${blockId}:`, e);
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
