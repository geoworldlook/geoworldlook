'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardBlockStats } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyards';

/**
 * Custom hook for managing GIS vineyard block polygon data and satellite analytics from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();

        // Try calling RPC function get_vineyard_blocks_geojson
        const { data: geojson, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (!rpcError && geojson && Array.isArray(geojson.features) && geojson.features.length > 0) {
          const formattedBlocks: VineyardBlock[] = geojson.features.map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.name || 'Unnamed Block',
            area_ha: Number(f.properties?.area_ha || 0),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
          return;
        }

        // Direct table select fallback if RPC function is not available
        const { data, error: tableError } = await supabase
          .from('vineyard_blocks')
          .select('id, name, area_ha, geom');

        if (!tableError && data && data.length > 0) {
          const formattedBlocks: VineyardBlock[] = data.map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha || 0),
            geom: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
          return;
        }

        // Fallback to mock data if DB has no data
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } catch (err: any) {
        console.warn('[GeoWorldLook] Supabase vineyard fetch failed, using mock data:', err);
        setError(err.message);
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical satellite statistics (NDVI, NDMI, cloud cover) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardBlockStats[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
        return mockBlock ? mockBlock.timeSeries : [];
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`[GeoWorldLook] Error fetching stats for block ${blockId}, fallback to mock:`, err);
      const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
