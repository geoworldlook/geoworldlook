
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<any>(null); // GeoJSON FeatureCollection
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          // Fallback for local development if RPC doesn't exist yet
          console.warn('RPC get_vineyard_blocks_geojson failed, using mock data:', error);
          setBlocks({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                id: 'mock-1',
                geometry: {
                  type: 'Polygon',
                  coordinates: [[[15.50, 51.93], [15.52, 51.93], [15.52, 51.94], [15.50, 51.94], [15.50, 51.93]]]
                },
                properties: {
                  id: 'mock-1',
                  name: 'Winnica Testowa (Mock)',
                  area_ha: 2.5
                }
              }
            ]
          });
        } else {
          setBlocks(data);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('*')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) {
        // Mock stats if table doesn't exist or is empty
        console.warn('Fetching vineyard_stats failed, using mock stats:', error);
        return Array.from({ length: 12 }).map((_, i) => ({
          block_id: blockId,
          date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
          cloud_cover: Math.random() * 20,
          ndvi_mean: 0.3 + Math.random() * 0.5,
          ndmi_mean: 0.1 + Math.random() * 0.4
        }));
      }

      return data || [];
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
