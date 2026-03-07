
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Station, StationTimeSeries } from '@/types/stations';

/**
 * Custom hook for managing Vineyard data from Supabase.
 * - Fetches vineyard blocks as GeoJSON.
 * - Fetches historical NDVI/NDMI time-series for selected block.
 */
export function useStationData() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all vineyard blocks (with latest stats) for the map
  useEffect(() => {
    async function fetchBlocks() {
      try {
        const { data, error } = await supabase.rpc('get_blocks_with_stats');

        if (error) throw error;

        // Map RPC result to the Station (reused for blocks) type
        const formattedBlocks: Station[] = (data || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          country: 'Vineyard Block', // Or some appropriate default
          area_ha: b.area_ha,
          geometry: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom,
          timeSeries: b.latest_ndvi ? [{
            date: b.latest_date,
            ndvi_index: Number(b.latest_ndvi),
            ndmi_index: Number(b.latest_ndmi),
            cloud_cover: 0 // Not returned by get_blocks_with_stats, can be 0 or null
          }] : []
        }));

        setStations(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches the historical stats for a specific vineyard block.
   */
  async function getStationStats(blockId: string): Promise<StationTimeSeries[]> {
    try {
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_index: Number(d.ndvi_mean),
        ndmi_index: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return [];
    }
  }

  return {
    stations, // Kept as stations to avoid breaking MapViewer interface
    loading,
    error,
    getStationStats
  };
}
