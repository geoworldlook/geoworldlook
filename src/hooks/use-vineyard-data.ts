'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-1-nebbiolo",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.45,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.940],
          [15.515, 51.940],
          [15.515, 51.930],
          [15.500, 51.930],
          [15.500, 51.940]
        ]
      ]
    },
    timeSeries: [
      { date: "2025-01-15", cloud_cover: 12.5, ndvi_mean: 0.18, ndmi_mean: -0.05 },
      { date: "2025-02-15", cloud_cover: 25.0, ndvi_mean: 0.22, ndmi_mean: -0.02 },
      { date: "2025-03-15", cloud_cover: 8.4, ndvi_mean: 0.31, ndmi_mean: 0.08 },
      { date: "2025-04-15", cloud_cover: 15.2, ndvi_mean: 0.45, ndmi_mean: 0.15 },
      { date: "2025-05-15", cloud_cover: 5.0, ndvi_mean: 0.62, ndmi_mean: 0.25 },
      { date: "2025-06-15", cloud_cover: 10.1, ndvi_mean: 0.73, ndmi_mean: 0.32 },
      { date: "2025-07-15", cloud_cover: 18.3, ndvi_mean: 0.78, ndmi_mean: 0.28 },
      { date: "2025-08-15", cloud_cover: 4.2, ndvi_mean: 0.71, ndmi_mean: 0.20 },
      { date: "2025-09-15", cloud_cover: 11.0, ndvi_mean: 0.58, ndmi_mean: 0.12 },
      { date: "2025-10-15", cloud_cover: 14.8, ndvi_mean: 0.42, ndmi_mean: 0.05 },
      { date: "2025-11-15", cloud_cover: 32.1, ndvi_mean: 0.28, ndmi_mean: -0.01 },
      { date: "2025-12-15", cloud_cover: 21.4, ndvi_mean: 0.19, ndmi_mean: -0.04 },
    ]
  },
  {
    id: "block-2-solaris",
    name: "Parcela South Solaris",
    area_ha: 3.12,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.520, 51.940],
          [15.535, 51.940],
          [15.535, 51.930],
          [15.520, 51.930],
          [15.520, 51.940]
        ]
      ]
    },
    timeSeries: [
      { date: "2025-01-15", cloud_cover: 15.4, ndvi_mean: 0.15, ndmi_mean: -0.08 },
      { date: "2025-02-15", cloud_cover: 22.1, ndvi_mean: 0.20, ndmi_mean: -0.04 },
      { date: "2025-03-15", cloud_cover: 10.2, ndvi_mean: 0.29, ndmi_mean: 0.05 },
      { date: "2025-04-15", cloud_cover: 12.0, ndvi_mean: 0.48, ndmi_mean: 0.18 },
      { date: "2025-05-15", cloud_cover: 6.5, ndvi_mean: 0.65, ndmi_mean: 0.28 },
      { date: "2025-06-15", cloud_cover: 9.8, ndvi_mean: 0.76, ndmi_mean: 0.35 },
      { date: "2025-07-15", cloud_cover: 14.2, ndvi_mean: 0.81, ndmi_mean: 0.30 },
      { date: "2025-08-15", cloud_cover: 5.1, ndvi_mean: 0.74, ndmi_mean: 0.22 },
      { date: "2025-09-15", cloud_cover: 8.9, ndvi_mean: 0.61, ndmi_mean: 0.15 },
      { date: "2025-10-15", cloud_cover: 12.3, ndvi_mean: 0.45, ndmi_mean: 0.08 },
      { date: "2025-11-15", cloud_cover: 28.5, ndvi_mean: 0.26, ndmi_mean: 0.00 },
      { date: "2025-12-15", cloud_cover: 19.1, ndvi_mean: 0.17, ndmi_mean: -0.06 },
    ]
  },
  {
    id: "block-3-pinot",
    name: "Parcela East Pinot Noir",
    area_ha: 1.85,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.510, 51.925],
          [15.525, 51.925],
          [15.525, 51.915],
          [15.510, 51.915],
          [15.510, 51.925]
        ]
      ]
    },
    timeSeries: [
      { date: "2025-01-15", cloud_cover: 11.2, ndvi_mean: 0.16, ndmi_mean: -0.07 },
      { date: "2025-02-15", cloud_cover: 18.5, ndvi_mean: 0.21, ndmi_mean: -0.03 },
      { date: "2025-03-15", cloud_cover: 9.0, ndvi_mean: 0.30, ndmi_mean: 0.06 },
      { date: "2025-04-15", cloud_cover: 14.1, ndvi_mean: 0.44, ndmi_mean: 0.14 },
      { date: "2025-05-15", cloud_cover: 4.8, ndvi_mean: 0.60, ndmi_mean: 0.22 },
      { date: "2025-06-15", cloud_cover: 11.2, ndvi_mean: 0.71, ndmi_mean: 0.29 },
      { date: "2025-07-15", cloud_cover: 16.5, ndvi_mean: 0.75, ndmi_mean: 0.26 },
      { date: "2025-08-15", cloud_cover: 6.0, ndvi_mean: 0.69, ndmi_mean: 0.18 },
      { date: "2025-09-15", cloud_cover: 10.5, ndvi_mean: 0.56, ndmi_mean: 0.10 },
      { date: "2025-10-15", cloud_cover: 13.0, ndvi_mean: 0.40, ndmi_mean: 0.03 },
      { date: "2025-11-15", cloud_cover: 30.2, ndvi_mean: 0.25, ndmi_mean: -0.02 },
      { date: "2025-12-15", cloud_cover: 22.0, ndvi_mean: 0.18, ndmi_mean: -0.05 },
    ]
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Sprawdzenie zmiennych środowiskowych przed inicjalizacją klienta
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
      setBlocks(MOCK_BLOCKS);
      setLoading(false);
      return;
    }

    async function fetchBlocks() {
      try {
        const supabase = createClient();
        // Wywołanie RPC do pobrania GeoJSON
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // data to obiekt GeoJSON FeatureCollection
        const geojson = data || { type: 'FeatureCollection', features: [] };

        const formattedBlocks: VineyardBlock[] = (geojson.features || []).map((f: any) => ({
          id: f.properties.id || f.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha || 0),
          geom: f.geometry,
          timeSeries: [] // Ładowane dynamicznie przy kliknięciu
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback w razie błędu sieci/bazy
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Pobiera historię statystyk dla wybranej działki.
   */
  async function getVineyardStats(blockId: string): Promise<VineyardStat[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      // Mock stats fallback
      const mockBlock = MOCK_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : [];
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      // Fallback
      const mockBlock = MOCK_BLOCKS.find(b => b.id === blockId);
      return mockBlock ? mockBlock.timeSeries : [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getVineyardStats
  };
}
