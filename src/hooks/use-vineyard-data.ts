'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Mock Data for Poland (Zielona Góra region, approx 15.5 longitude, 51.9 latitude)
const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-zg-01',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 4.5,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.48, 51.88],
          [15.52, 51.88],
          [15.52, 51.90],
          [15.48, 51.90],
          [15.48, 51.88]
        ]
      ]
    }
  },
  {
    id: 'block-zg-02',
    name: 'Parcela Srebrna Góra Pinot',
    area_ha: 3.2,
    geom: {
      type: 'Polygon',
      coordinates: [
        [
          [15.53, 51.91],
          [15.57, 51.91],
          [15.57, 51.93],
          [15.53, 51.93],
          [15.53, 51.91]
        ]
      ]
    }
  }
];

// Helper to generate agricultural curves for both NDVI and NDMI over 12 months
function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2025-01-15');

  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    const monthIndex = i; // 0 to 11

    // Phenology values: Low in winter, peaking in summer
    let ndvi = 0.2 + Math.random() * 0.05;
    let ndmi = -0.1 + Math.random() * 0.05;

    if (monthIndex >= 3 && monthIndex <= 5) { // spring growth
      ndvi = 0.35 + (monthIndex - 3) * 0.12 + Math.random() * 0.05;
      ndmi = 0.0 + (monthIndex - 3) * 0.08 + Math.random() * 0.05;
    } else if (monthIndex >= 6 && monthIndex <= 8) { // summer peak
      ndvi = 0.75 + Math.random() * 0.08;
      ndmi = 0.25 - (monthIndex - 6) * 0.05 + Math.random() * 0.05;
    } else if (monthIndex >= 9 && monthIndex <= 10) { // autumn drop
      ndvi = 0.45 - (monthIndex - 9) * 0.1 + Math.random() * 0.05;
      ndmi = 0.1 - (monthIndex - 9) * 0.08 + Math.random() * 0.05;
    }

    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      cloud_cover: Math.floor(Math.random() * 15),
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3))
    });
  }
  return stats;
}

const MOCK_VINEYARD_STATS: VineyardStat[] = [
  ...generateMockStats('block-zg-01'),
  ...generateMockStats('block-zg-02')
];

/**
 * Custom hook for managing GIS vineyard block data from Supabase.
 * - Explicitly checks for environment variables before client initialization.
 * - Defers client initialization until within execution logic.
 * - Automatically falls back to mock data centered on Zielona Góra, PL.
 */
export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard blocks data');
        setBlocks(MOCK_VINEYARD_BLOCKS);
        setLoading(false); // Explicitly set loading to false to allow UI initialization
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        // get_vineyard_blocks_geojson returns a GeoJSON FeatureCollection
        const features = data?.features || [];
        const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
          id: f.properties.id || f.id,
          name: f.properties.name,
          area_ha: Number(f.properties.area_ha),
          geom: f.geometry
        }));

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback on error
        setBlocks(MOCK_VINEYARD_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  /**
   * Fetches historical vineyard statistics for a specific block.
   */
  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return MOCK_VINEYARD_STATS.filter(s => s.block_id === blockId);
    }

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
      // Fallback on error
      return MOCK_VINEYARD_STATS.filter(s => s.block_id === blockId);
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
