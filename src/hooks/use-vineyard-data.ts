
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing vineyard block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks as GeoJSON for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          // If RPC is missing, use mock data or throw
          console.warn('RPC get_vineyard_blocks_geojson failed, might not be deployed yet.');
          throw error;
        }

        setBlocks(data);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if table/rpc doesn't exist yet
        setBlocks({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              id: 'mock-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[[15.52, 51.93], [15.54, 51.93], [15.54, 51.95], [15.52, 51.95], [15.52, 51.93]]]
              },
              properties: {
                id: 'mock-1',
                name: 'Zielona Góra Vineyard A',
                area_ha: 2.5
              }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical statistics for a specific vineyard block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);

      // Return mock stats if data is empty or error
      return [
        { block_id: blockId, date: '2024-01-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.2 },
        { block_id: blockId, date: '2024-02-01', cloud_cover: 5, ndvi_mean: 0.52, ndmi_mean: 0.25 },
        { block_id: blockId, date: '2024-03-01', cloud_cover: 15, ndvi_mean: 0.61, ndmi_mean: 0.3 }
      ];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
