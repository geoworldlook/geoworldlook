'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  VineyardBlock,
  VineyardTimeSeries,
  VineyardFeatureCollection,
  VineyardBlockFeature
} from '@/types/vineyards';

function generateAgriCurves(weekIndex: number) {
  // NDVI: Low in winter (~0.2), grows in spring (~0.5-0.7), peaks in summer (~0.85), harvest drop (~0.3)
  // NDMI: Moisture balance index (-1 to +1), higher in early spring/rainy weeks, lower during summer heat
  let ndvi = 0.25;
  let ndmi = 0.40;

  if (weekIndex <= 12) {
    ndvi = 0.20 + Math.random() * 0.05;
    ndmi = 0.35 + Math.random() * 0.10;
  } else if (weekIndex <= 21) {
    ndvi = 0.30 + (weekIndex - 12) * 0.04;
    ndmi = 0.45 + Math.random() * 0.08;
  } else if (weekIndex <= 30) {
    ndvi = 0.72 + Math.random() * 0.12;
    ndmi = 0.20 + Math.random() * 0.15; // Summer moisture stress
  } else if (weekIndex <= 35) {
    ndvi = 0.82 - (weekIndex - 30) * 0.12;
    ndmi = 0.25 + Math.random() * 0.10;
  } else {
    ndvi = 0.22 + Math.random() * 0.06;
    ndmi = 0.38 + Math.random() * 0.08;
  }

  return {
    ndvi_mean: parseFloat(ndvi.toFixed(3)),
    ndmi_mean: parseFloat(ndmi.toFixed(3)),
    cloud_cover: Math.floor(Math.random() * 25)
  };
}

function generateMockTimeSeries(): VineyardTimeSeries[] {
  const series: VineyardTimeSeries[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const metrics = generateAgriCurves(i);
    series.push({
      date: d.toISOString().split('T')[0],
      ...metrics
    });
  }
  return series;
}

const MOCK_MOCK_TIMESERIES_MAP: Record<string, VineyardTimeSeries[]> = {
  'blk-01': generateMockTimeSeries(),
  'blk-02': generateMockTimeSeries(),
  'blk-03': generateMockTimeSeries(),
};

const MOCK_FEATURE_COLLECTION: VineyardFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'blk-01',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.502, 51.932],
            [15.508, 51.932],
            [15.507, 51.936],
            [15.501, 51.935],
            [15.502, 51.932]
          ]
        ]
      },
      properties: {
        id: 'blk-01',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 4.25
      }
    },
    {
      type: 'Feature',
      id: 'blk-02',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.510, 51.925],
            [15.518, 51.926],
            [15.516, 51.930],
            [15.509, 51.929],
            [15.510, 51.925]
          ]
        ]
      },
      properties: {
        id: 'blk-02',
        name: 'Sektor Południowy Riesling',
        area_ha: 6.80
      }
    },
    {
      type: 'Feature',
      id: 'blk-03',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [15.492, 51.928],
            [15.499, 51.929],
            [15.497, 51.933],
            [15.490, 51.931],
            [15.492, 51.928]
          ]
        ]
      },
      properties: {
        id: 'blk-03',
        name: 'Wzgórze Zachodnie Pinot Noir',
        area_ha: 3.50
      }
    }
  ]
};

/**
 * Hook to manage Vineyard Polygon Blocks & Copernicus Satellite Stats from Supabase.
 */
export function useVineyardData() {
  const [featureCollection, setFeatureCollection] = useState<VineyardFeatureCollection>(MOCK_FEATURE_COLLECTION);
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (error) throw error;

        if (data && data.features && data.features.length > 0) {
          setFeatureCollection(data as VineyardFeatureCollection);

          const formattedBlocks: VineyardBlock[] = data.features.map((f: VineyardBlockFeature) => ({
            id: f.id || f.properties.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        } else {
          // Fallback to mock data if table/RPC returns empty
          const formattedBlocks: VineyardBlock[] = MOCK_FEATURE_COLLECTION.features.map(f => ({
            id: f.id,
            name: f.properties.name,
            area_ha: f.properties.area_ha,
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.warn('[useVineyardData] Supabase fetch fallback to mock data:', err?.message || err);
        const formattedBlocks: VineyardBlock[] = MOCK_FEATURE_COLLECTION.features.map(f => ({
          id: f.id,
          name: f.properties.name,
          area_ha: f.properties.area_ha,
          geom: f.geometry
        }));
        setBlocks(formattedBlocks);
        setError(err?.message || 'Error loading vineyard blocks');
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('date, ndvi_mean, ndmi_mean, cloud_cover')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return MOCK_MOCK_TIMESERIES_MAP[blockId] || generateMockTimeSeries();
      }

      return data.map((d: any) => ({
        date: d.date,
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean),
        cloud_cover: Number(d.cloud_cover)
      }));
    } catch (err: any) {
      console.warn(`[getBlockStats] Using mock stats for block ${blockId}`);
      return MOCK_MOCK_TIMESERIES_MAP[blockId] || generateMockTimeSeries();
    }
  }

  return {
    blocks,
    featureCollection,
    loading,
    error,
    getBlockStats
  };
}
