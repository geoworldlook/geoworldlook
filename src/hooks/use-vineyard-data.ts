
'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Mock data for fallback when Supabase is not configured
const MOCK_BLOCKS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.50, 51.93], [15.52, 51.93], [15.52, 51.94], [15.50, 51.94], [15.50, 51.93]]]
      },
      properties: {
        id: 'mock-block-1',
        name: 'Zielona Góra Vineyard A',
        area_ha: 4.5
      }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[15.53, 51.935], [15.55, 51.935], [15.55, 51.945], [15.53, 51.945], [15.53, 51.935]]]
      },
      properties: {
        id: 'mock-block-2',
        name: 'Zielona Góra Vineyard B',
        area_ha: 3.2
      }
    }
  ]
};

function generateMockStats(blockId: string): VineyardStats[] {
  const stats: VineyardStats[] = [];
  const now = new Date();
  for (let i = 12; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: -0.2 + Math.random() * 0.6,
      cloud_cover: Math.random() * 20
    });
  }
  return stats;
}

/**
 * Custom hook for managing vineyard data from Supabase.
 * - Fetches all vineyard blocks with geometries as GeoJSON via RPC.
 * - Fetches historical NDVI/NDMI stats for a specific selected block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return null;
    }
    return createClient();
  }, []);

  // 1. Fetch all vineyard blocks (GeoJSON)
  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!supabase) {
          console.warn('[GeoWorldLook] Supabase env vars missing — using mock blocks');
          const formattedBlocks: VineyardBlock[] = (MOCK_BLOCKS_GEOJSON.features || []).map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry,
            stats: []
          }));
          setBlocks(formattedBlocks);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
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
  }, [supabase]);

  /**
   * Fetches historical statistics for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    try {
      if (!supabase || blockId.startsWith('mock-')) {
        return generateMockStats(blockId);
      }

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
    blocks,
    loading,
    error,
    getBlockStats
  };
}
