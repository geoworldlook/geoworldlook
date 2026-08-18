'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyards';

/**
 * Custom hook for managing vineyard blocks and satellite statistics from Supabase.
 * - Fetches vineyard blocks as GeoJSON features/polygons.
 * - Fetches historical NDVI/NDMI time-series for a selected block.
 * - Falls back gracefully to mock data when Supabase variables are not configured.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
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
        // Call RPC function get_vineyard_blocks_geojson
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) {
          console.warn('RPC error fetching vineyard blocks GeoJSON, falling back to table query:', rpcError);
          // Fallback table query
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha');

          if (tableError) throw tableError;

          const formatted: VineyardBlock[] = (tableData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha || 0),
            geom: null,
            timeSeries: []
          }));
          setBlocks(formatted.length > 0 ? formatted : MOCK_VINEYARD_BLOCKS);
        } else if (rpcData && rpcData.features && rpcData.features.length > 0) {
          const formattedBlocks: VineyardBlock[] = rpcData.features.map((f: any) => ({
            id: f.properties?.id || f.id,
            name: f.properties?.name || 'Winnica',
            area_ha: Number(f.properties?.area_ha || 0),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
        } else {
          setBlocks(MOCK_VINEYARD_BLOCKS);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : MOCK_VINEYARD_BLOCKS[0].timeSeries;
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
        return mockBlock ? mockBlock.timeSeries : MOCK_VINEYARD_BLOCKS[0].timeSeries;
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean ?? 0),
        ndmi_mean: Number(d.ndmi_mean ?? 0),
        cloud_cover: Number(d.cloud_cover ?? 0)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : MOCK_VINEYARD_BLOCKS[0].timeSeries;
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
