'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  VineyardBlock,
  VineyardStat,
  VineyardBlockFeatureCollection,
  VineyardBlockGeoJSONFeature
} from '@/types/vineyard';

// Mock data for Zielona Góra region (approx [15.5, 51.9])
const MOCK_FEATURE_COLLECTION: VineyardBlockFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'vb-zg-01',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.512, 51.935],
          [15.525, 51.938],
          [15.528, 51.928],
          [15.515, 51.925],
          [15.512, 51.935]
        ]]
      },
      properties: {
        id: 'vb-zg-01',
        name: 'Parcela Zielona Góra - Winniewska',
        area_ha: 14.5
      }
    },
    {
      type: 'Feature',
      id: 'vb-zg-02',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.532, 51.942],
          [15.545, 51.945],
          [15.548, 51.935],
          [15.535, 51.932],
          [15.532, 51.942]
        ]]
      },
      properties: {
        id: 'vb-zg-02',
        name: 'Parcela Monte Verde - Nebbiolo',
        area_ha: 18.2
      }
    },
    {
      type: 'Feature',
      id: 'vb-zg-03',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [15.495, 51.920],
          [15.508, 51.922],
          [15.510, 51.912],
          [15.498, 51.910],
          [15.495, 51.920]
        ]]
      },
      properties: {
        id: 'vb-zg-03',
        name: 'Parcela Pinot Noir - Stara Góra',
        area_ha: 9.8
      }
    }
  ]
};

function generateMockTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    // Phenology curve simulation
    let ndvi = 0.25;
    let ndmi = 0.15;
    if (i >= 12 && i <= 21) {
      ndvi = 0.3 + (i - 12) * 0.04;
      ndmi = 0.2 + (i - 12) * 0.03;
    } else if (i > 21 && i <= 30) {
      ndvi = 0.72 + Math.random() * 0.1;
      ndmi = 0.50 + Math.random() * 0.1;
    } else if (i > 30 && i <= 34) {
      ndvi = 0.80 - (i - 30) * 0.12;
      ndmi = 0.55 - (i - 30) * 0.10;
    } else if (i > 34) {
      ndvi = 0.22 + Math.random() * 0.06;
      ndmi = 0.12 + Math.random() * 0.05;
    }

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(Math.min(1, Math.max(0, ndvi)).toFixed(3)),
      ndmi_mean: parseFloat(Math.min(1, Math.max(-1, ndmi)).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 25)
    });
  }
  return series;
}

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [featureCollection, setFeatureCollection] = useState<VineyardBlockFeatureCollection>(MOCK_FEATURE_COLLECTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      const hasSupabaseEnv = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (!hasSupabaseEnv) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard polygon data');
        const mockBlocks: VineyardBlock[] = MOCK_FEATURE_COLLECTION.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          timeSeries: []
        }));
        setFeatureCollection(MOCK_FEATURE_COLLECTION);
        setBlocks(mockBlocks);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        const fc: VineyardBlockFeatureCollection = data && data.type === 'FeatureCollection'
          ? data
          : MOCK_FEATURE_COLLECTION;

        if (!data || !data.features || data.features.length === 0) {
          setFeatureCollection(MOCK_FEATURE_COLLECTION);
          setBlocks(MOCK_FEATURE_COLLECTION.features.map(f => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry,
            timeSeries: []
          })));
        } else {
          setFeatureCollection(fc);
          const formattedBlocks: VineyardBlock[] = fc.features.map((f: VineyardBlockGeoJSONFeature) => ({
            id: f.properties.id || f.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry,
            timeSeries: []
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback to mock data
        setFeatureCollection(MOCK_FEATURE_COLLECTION);
        setBlocks(MOCK_FEATURE_COLLECTION.features.map(f => ({
          id: f.properties.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry,
          timeSeries: []
        })));
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  async function getVineyardStats(blockId: string): Promise<VineyardStat[]> {
    const hasSupabaseEnv = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!hasSupabaseEnv) {
      return generateMockTimeSeries();
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return generateMockTimeSeries();
      }

      return data.map((d: any) => ({
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.error(`Error fetching stats for block ${blockId}:`, err);
      return generateMockTimeSeries();
    }
  }

  return {
    blocks,
    featureCollection,
    loading,
    error,
    getVineyardStats
  };
}
