'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/stations';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/stations';

/**
 * Custom hook for managing Vineyard Polygon Blocks data from Supabase.
 * - Fetches vineyard blocks (GeoJSON polygons).
 * - Fetches historical NDVI and NDMI time-series for selected vineyard blocks.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Fallback to mock data if Supabase URL is missing
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // 1. Try RPC function returning GeoJSON FeatureCollection
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (!rpcError && rpcData && rpcData.features && rpcData.features.length > 0) {
          const formattedBlocks: VineyardBlock[] = rpcData.features.map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.name || 'Winnica',
            area_ha: Number(f.properties?.area_ha || 0),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
          setLoading(false);
          return;
        }

        // 2. Fallback to direct table select
        const { data: tableData, error: tableError } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (tableError) throw tableError;

        if (tableData && tableData.length > 0) {
          const formattedBlocks: VineyardBlock[] = tableData.map((b: any) => {
            let parsedGeom = b.geom;
            if (typeof b.geom === 'string') {
              try { parsedGeom = JSON.parse(b.geom); } catch { parsedGeom = null; }
            }
            return {
              id: b.id,
              name: b.name,
              area_ha: Number(b.area_ha || 0),
              geom: parsedGeom || { type: 'Polygon', coordinates: [] },
              timeSeries: []
            };
          });
          setBlocks(formattedBlocks);
        } else {
          setBlocks(MOCK_VINEYARD_BLOCKS);
        }
      } catch (err: any) {
        console.warn('[useVineyardData] Error fetching vineyard blocks, using mock data:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical time series (NDVI & NDMI) for a specific vineyard block.
   */
  async function getVineyardStats(blockId: string): Promise<VineyardStats[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
        return mockBlock ? mockBlock.timeSeries : [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean ?? 0),
        ndmi_mean: Number(d.ndmi_mean ?? 0),
        cloud_cover: Number(d.cloud_cover ?? 0)
      }));
    } catch (err: any) {
      console.warn(`[useVineyardData] Error fetching stats for block ${blockId}:`, err);
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getVineyardStats
  };
}

// Alias for backwards compatibility
export const useStationData = useVineyardData;
