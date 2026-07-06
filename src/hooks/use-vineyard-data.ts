
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, BlockStats } from '@/types/vineyard';

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error('Supabase environment variables are missing');
        }

        const supabase = createClient();
        // Use RPC function for GeoJSON if possible, or direct select
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) {
          console.warn('RPC failed, falling back to direct table select', error);
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha');

          if (tableError) throw tableError;

          // Fallback mock or basic mapping
          setBlocks((tableData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: b.area_ha,
            geom: null // Geometries are tricky without the RPC or PostGIS conversion
          })));
        } else {
          // data is a FeatureCollection from the RPC
          const formattedBlocks: VineyardBlock[] = (data.features || []).map((f: any) => ({
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

        // Mock data for development if DB is not ready
        setBlocks([
          {
            id: 'mock-1',
            name: 'Parcela Nord Nebbiolo (Mock)',
            area_ha: 2.5,
            geom: {
              type: 'Polygon',
              coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<BlockStats[]> {
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase environment variables are missing');
      }
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
      console.error(`Error fetching stats for block ${blockId}:`, err);
      // Mock stats for development
      return Array.from({ length: 12 }, (_, i) => ({
        date: `2024-${(i + 1).toString().padStart(2, '0')}-01`,
        ndvi_mean: 0.2 + Math.random() * 0.6,
        ndmi_mean: 0.1 + Math.random() * 0.4,
        cloud_cover: Math.random() * 20
      }));
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
