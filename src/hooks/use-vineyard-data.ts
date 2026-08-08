'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardTimeSeries } from '@/types/vineyard';

// Generuje realistyczny przebieg indeksów wegetacyjnych i stresu wodnego dla winnicy w Zielonej Górze
function generateAgriData(weeks: number): VineyardTimeSeries[] {
  const series: VineyardTimeSeries[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < weeks; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    // Przebieg NDVI: Niskie zima/wczesna wiosna, szczyt w czerwcu/lipcu, powolny spadek przed zbiorami
    let ndvi = 0.2;
    if (i > 12 && i <= 24) {
      ndvi = 0.2 + (i - 12) * 0.05; // Wzrost wiosenny
    } else if (i > 24 && i <= 34) {
      ndvi = 0.8 - (i - 24) * 0.01; // Szczyt i stabilizacja
    } else if (i > 34 && i <= 42) {
      ndvi = 0.7 - (i - 34) * 0.05; // Żniwa / opadanie liści
    } else if (i > 42) {
      ndvi = 0.2 + Math.random() * 0.05; // Spoczynek zimowy
    }
    ndvi = parseFloat(Math.max(0.15, Math.min(0.9, ndvi + (Math.random() * 0.06 - 0.03))).toFixed(3));

    // Przebieg NDMI (stres wodny): odzwierciedla wilgotność liści i gleby.
    // Zazwyczaj skorelowane z wegetacją, ale spada przy suszy w lipcu/sierpniu (indeks od -1 do 1, typowo 0.1 do 0.5)
    let ndmi = 0.05;
    if (i > 12 && i <= 24) {
      ndmi = 0.1 + (i - 12) * 0.02;
    } else if (i > 24 && i <= 32) {
      ndmi = 0.34 - (i - 24) * 0.02; // Susza letnia, spadek wilgotności
    } else if (i > 32 && i <= 42) {
      ndmi = 0.18 + (i - 32) * 0.01; // Jesienne deszcze, lekki wzrost
    }
    ndmi = parseFloat(Math.max(-0.2, Math.min(0.6, ndmi + (Math.random() * 0.08 - 0.04))).toFixed(3));

    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: ndvi,
      ndmi_mean: ndmi,
      cloud_cover: Math.floor(Math.random() * 15)
    });
  }
  return series;
}

// 3 działki testowe w rejonie Zielonej Góry (ok. 15.5, 51.9)
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-zg-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.50,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.903],
        [15.500, 51.903],
        [15.500, 51.900]
      ]]
    },
    timeSeries: generateAgriData(52)
  },
  {
    id: "block-zg-02",
    name: "Sektor Pinot Noir",
    area_ha: 1.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.510, 51.905],
        [15.515, 51.905],
        [15.515, 51.908],
        [15.510, 51.908],
        [15.510, 51.905]
      ]]
    },
    timeSeries: generateAgriData(52)
  },
  {
    id: "block-zg-03",
    name: "Wzgórze Chardonnay",
    area_ha: 3.20,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.490, 51.895],
        [15.495, 51.895],
        [15.495, 51.898],
        [15.490, 51.898],
        [15.490, 51.895]
      ]]
    },
    timeSeries: generateAgriData(52)
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardData() {
      // Bezpieczne sprawdzenie zmiennych środowiskowych przed inicjalizacją Supabase
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        console.warn('[GeoWorldLook] Supabase config missing — using high-quality mock polygon data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Pobieramy działki jako GeoJSON przy użyciu RPC
        const { data: geojsonData, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');
        if (rpcError) throw rpcError;

        const features = geojsonData?.features || [];

        // Pobieramy statystyki ze stacji
        const { data: statsData, error: statsError } = await supabase
          .from('vineyard_stats')
          .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
          .order('date', { ascending: true });

        if (statsError) throw statsError;

        const formattedBlocks: VineyardBlock[] = features.map((feat: any) => {
          const blockId = feat.properties.id;
          const blockStats = (statsData || [])
            .filter((s: any) => s.block_id === blockId)
            .map((s: any) => ({
              date: s.date,
              ndvi_mean: Number(s.ndvi_mean),
              ndmi_mean: Number(s.ndmi_mean),
              cloud_cover: Number(s.cloud_cover)
            }));

          return {
            id: blockId,
            name: feat.properties.name,
            area_ha: Number(feat.properties.area_ha || 0),
            geom: feat.geometry,
            timeSeries: blockStats.length > 0 ? blockStats : generateAgriData(52) // fallback if stats empty
          };
        });

        setBlocks(formattedBlocks);
      } catch (err: any) {
        console.error('Error fetching vineyard blocks:', err);
        setError(err.message);
        // Fallback w razie błędu
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardData();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardTimeSeries[]> {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const match = MOCK_BLOCKS.find(b => b.id === blockId);
      return match ? match.timeSeries : [];
    }

    try {
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
      const match = MOCK_BLOCKS.find(b => b.id === blockId);
      return match ? match.timeSeries : [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
