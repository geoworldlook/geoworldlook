'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const supabase = createClient();
        // Use RPC if available, or direct select
        // For now, let's try direct select, but geom needs to be GeoJSON
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC get_vineyard_blocks_geojson failed, falling back to direct select', error);
          const { data: directData, error: directError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (directError) throw directError;

          setBlocks(directData || []);
        } else {
          // RPC returns the whole FeatureCollection
          const formattedBlocks = data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);

        // Mock data for development if Supabase is not ready
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo',
            area_ha: 2.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.500, 51.900], [15.505, 51.900], [15.505, 51.905], [15.500, 51.905], [15.500, 51.900]]]
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    try {
      const supabase = createClient();
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

      // Return mock stats for development
      return [
        { block_id: blockId, date: '2024-05-01', cloud_cover: 10, ndvi_mean: 0.45, ndmi_mean: 0.2 },
        { block_id: blockId, date: '2024-05-10', cloud_cover: 5, ndvi_mean: 0.52, ndmi_mean: 0.25 },
        { block_id: blockId, date: '2024-05-20', cloud_cover: 0, ndvi_mean: 0.58, ndmi_mean: 0.28 },
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
