
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

/**
 * Custom hook for managing Vineyard Block data from Supabase.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSupabase = () => {
    try {
      return createClient();
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    async function fetchBlocks() {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo (Mock)',
            area_ha: 2.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.50, 51.90], [15.51, 51.90], [15.51, 51.91], [15.50, 51.91], [15.50, 51.90]]]
            },
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }

      try {
        // Używamy funkcji RPC aby dostać gotowy GeoJSON
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          // Jeśli RPC nie istnieje, spróbujmy zwykłego selecta (może rzucić błąd jeśli geom nie jest rzutowany)
          const { data: selectData, error: selectError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom, created_at');

          if (selectError) throw selectError;
          setBlocks(selectData || []);
        } else {
          // data to FeatureCollection
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry,
            created_at: f.properties.created_at
          }));
          setBlocks(formattedBlocks);
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
    const supabase = getSupabase();
    if (!supabase) {
      return [
        { date: '2024-01-01', ndvi_mean: 0.2, ndmi_mean: 0.1, cloud_cover: 10 },
        { date: '2024-02-01', ndvi_mean: 0.3, ndmi_mean: 0.15, cloud_cover: 5 },
        { date: '2024-03-01', ndvi_mean: 0.5, ndmi_mean: 0.3, cloud_cover: 20 },
        { date: '2024-04-01', ndvi_mean: 0.7, ndmi_mean: 0.4, cloud_cover: 0 },
        { date: '2024-05-01', ndvi_mean: 0.8, ndmi_mean: 0.5, cloud_cover: 15 },
      ];
    }

    try {
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
