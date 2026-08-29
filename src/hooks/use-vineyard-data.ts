'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';
import { MOCK_VINEYARD_BLOCKS } from '@/lib/mock-data/vineyards';

/**
 * Custom hook for managing Vineyard Block GIS data from Supabase.
 * - Fetches vineyard polygon blocks for map layers.
 * - Fetches historical NDVI & NDMI time-series for selected vineyard block.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      // Check if Supabase env variables are present
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials missing, falling back to mock vineyard blocks.');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) throw rpcError;

        const geojson = rpcData || {};
        const features = geojson.features || [];

        if (features.length === 0) {
          // Fallback to mock data if table is empty in dev
          setBlocks(MOCK_VINEYARD_BLOCKS);
        } else {
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            id: f.id || f.properties?.id,
            name: f.properties?.name || 'Unnamed Vineyard Block',
            area_ha: Number(f.properties?.area_ha || 0),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks from Supabase:', err);
        setError(err.message || 'Error loading vineyard data');
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical time series (NDVI, NDMI, Cloud Cover) for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    // Check mock blocks first if local or fallback
    const mockBlock = MOCK_VINEYARD_BLOCKS.find(b => b.id === blockId);
    if (mockBlock && mockBlock.timeSeries.length > 0) {
      return mockBlock.timeSeries;
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return mockBlock?.timeSeries || [];
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
      console.error(`Error fetching stats for vineyard block ${blockId}:`, err);
      return mockBlock?.timeSeries || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
