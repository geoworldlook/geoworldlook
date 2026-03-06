
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Station, StationTimeSeries } from '@/types/stations';

/**
 * Custom hook for managing GIS station data from Supabase.
 * - Fetches all active stations for map markers.
 * - Fetches historical NDVI time-series for a specific selected station.
 */
export function useStationData() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // 1. Fetch all stations for the map
  useEffect(() => {
    async function fetchStations() {
      try {
        const { data, error } = await supabase
          .from('stations')
          .select('id, name, country, lat, lng');

        if (error) throw error;

        // Map database fields to the Station type
        const formattedStations: Station[] = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          country: s.country,
          coordinates: [s.lng, s.lat],
          timeSeries: [] // Initialized empty, loaded on selection
        }));

        setStations(formattedStations);
      } catch (err: any) {
        console.error('Error fetching stations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStations();
  }, []);

  /**
   * Fetches the 12-month time series for a specific station.
   * Handles cloud cover filtering and sorting.
   */
  async function getStationStats(stationId: string): Promise<StationTimeSeries[]> {
    try {
      const { data, error } = await supabase
        .from('station_stats')
        .select('date, ndvi_index, cloud_cover')
        .eq('station_id', stationId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        ndvi_index: Number(d.ndvi_index), // TWARDE RZUTOWANIE NA LICZBĘ //ndvi_index: d.ndvi_index,
        cloud_cover: Number(d.cloud_cover) // TWARDE RZUTOWANIE NA LICZBĘ//cloud_cover: d.cloud_cover
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for station ${stationId}:`, err);
      return [];
    }
  }

  return {
    stations,
    loading,
    error,
    getStationStats
  };
}
