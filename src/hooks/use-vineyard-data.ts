'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

// Generates simulated historical agricultural index curve
function generateAgriCurve(weekIndex: number, type: 'ndvi' | 'ndmi'): number {
  if (type === 'ndvi') {
    // Jan-Mar (0-12): Low (0.2 - 0.3)
    // Apr-May (13-21): Growth (0.4 - 0.6)
    // Jun-Jul (22-30): Peak (0.7 - 0.85)
    // Aug (31-34): Harvest drop (0.8 -> 0.25)
    // Sep-Dec (35-51): Stable/Low (0.2 - 0.3)
    if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
    if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
    return 0.2 + Math.random() * 0.08;
  } else {
    // ndmi: Water/Moisture Index, typically ranges from -0.2 to 0.6 in vegetation, peaking in peak season
    if (weekIndex <= 12) return -0.1 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.0 + (weekIndex - 12) * 0.03;
    if (weekIndex <= 30) return 0.35 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.45 - (weekIndex - 30) * 0.1;
    return -0.1 + Math.random() * 0.08;
  }
}

function generateMockTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, 'ndvi').toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, 'ndmi').toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

// Target Zielona Góra region in Poland, approx coordinates near [15.5, 51.9]
export const MOCK_VINEYARDS: VineyardBlock[] = [
  {
    id: "block-zg-01",
    name: "Parcela Zielona Góra - Riesling",
    area_ha: 4.5,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.900],
          [15.515, 51.900],
          [15.515, 51.910],
          [15.500, 51.910],
          [15.500, 51.900]
        ]
      ]
    },
    stats: generateMockTimeSeries()
  },
  {
    id: "block-zg-02",
    name: "Parcela Zielona Góra - Pinot Noir",
    area_ha: 3.2,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.520, 51.905],
          [15.535, 51.905],
          [15.535, 51.915],
          [15.520, 51.915],
          [15.520, 51.905]
        ]
      ]
    },
    stats: generateMockTimeSeries()
  },
  {
    id: "block-zg-03",
    name: "Parcela Zielona Góra - Chardonnay",
    area_ha: 5.8,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.510, 51.885],
          [15.525, 51.885],
          [15.525, 51.895],
          [15.510, 51.895],
          [15.510, 51.885]
        ]
      ]
    },
    stats: generateMockTimeSeries()
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Defer client initialization inside useEffect to avoid issues during SSR or tests where env variables are missing
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv) {
      console.warn('[GeoWorldLook] Supabase env variables are missing. Falling back to Mock Vineyard Data.');
      setBlocks(MOCK_VINEYARDS);
      setLoading(false);
      return;
    }

    async function fetchVineyards() {
      try {
        const supabase = createClient();

        // Execute the RPC function which builds the GeoJSON FeatureCollection
        const { data: geoJsonData, error: geoJsonError } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (geoJsonError) throw geoJsonError;

        if (geoJsonData && geoJsonData.features) {
          const fetchedBlocks: VineyardBlock[] = geoJsonData.features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry,
            stats: [] // Will fetch stats on demand
          }));

          setBlocks(fetchedBlocks);
        } else {
          setBlocks([]);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data in case of any database/connection error
        setBlocks(MOCK_VINEYARDS);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyards();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStat[]> {
    const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!hasEnv) {
      const mockBlock = MOCK_VINEYARDS.find(b => b.id === blockId);
      return mockBlock?.stats || [];
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
      // Fallback to mock stats for local development if DB query fails or has no entries
      const mockBlock = MOCK_VINEYARDS.find(b => b.id === blockId);
      return mockBlock?.stats || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
