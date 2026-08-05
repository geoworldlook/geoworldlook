import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/vineyard';

// Zielona Góra, Poland coordinates approx [15.5, 51.9]
const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "vb-pl-01",
    name: "Parcela Północna Pinot Noir",
    area_ha: 4.20,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.500, 51.930],
          [15.508, 51.930],
          [15.508, 51.936],
          [15.500, 51.936],
          [15.500, 51.930]
        ]
      ]
    }
  },
  {
    id: "vb-pl-02",
    name: "Parcela Południowa Chardonnay",
    area_ha: 3.50,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.510, 51.925],
          [15.518, 51.925],
          [15.518, 51.931],
          [15.510, 51.931],
          [15.510, 51.925]
        ]
      ]
    }
  },
  {
    id: "vb-pl-03",
    name: "Parcela Wschodnia Riesling",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [
        [
          [15.522, 51.933],
          [15.530, 51.933],
          [15.530, 51.939],
          [15.522, 51.939],
          [15.522, 51.933]
        ]
      ]
    }
  }
];

function generateMockStats(blockId: string): VineyardStats[] {
  const stats: VineyardStats[] = [];
  const startYear = 2024;
  const startMonth = 5; // June (0-indexed is May/June)

  for (let i = 0; i < 12; i++) {
    const d = new Date(startYear, startMonth + i, 15);
    const month = d.getMonth();

    let ndvi = 0.25;
    if (month >= 4 && month <= 8) { // May - Sep
      ndvi = 0.65 + Math.sin((month - 4) * Math.PI / 4) * 0.18;
    } else {
      ndvi = 0.22 + Math.random() * 0.05;
    }

    let ndmi = -0.12;
    if (month >= 4 && month <= 8) {
      ndmi = 0.12 + Math.sin((month - 4) * Math.PI / 4) * 0.12 - (month === 6 ? 0.08 : 0);
    } else {
      ndmi = -0.06 + Math.random() * 0.04;
    }

    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat(ndmi.toFixed(3)),
      cloud_cover: Math.floor(4 + Math.random() * 20)
    });
  }
  return stats;
}

const MOCK_STATS: Record<string, VineyardStats[]> = {
  "vb-pl-01": generateMockStats("vb-pl-01"),
  "vb-pl-02": generateMockStats("vb-pl-02"),
  "vb-pl-03": generateMockStats("vb-pl-03")
};

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlocks() {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('[GeoWorldLook] Supabase env vars missing — using mock vineyard data');
        setBlocks(MOCK_BLOCKS);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError) {
          console.warn('[GeoWorldLook] RPC failed, trying direct select:', rpcError.message);
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, geom');

          if (tableError) throw tableError;

          const formattedBlocks: VineyardBlock[] = (tableData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            area_ha: Number(b.area_ha),
            geom: typeof b.geom === 'string' ? JSON.parse(b.geom) : b.geom
          }));

          setBlocks(formattedBlocks);
        } else {
          const features = data?.features || [];
          const formattedBlocks: VineyardBlock[] = features.map((f: any) => ({
            id: f.properties.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.error('[GeoWorldLook] Error fetching vineyard blocks:', err);
        setError(err.message);
        setBlocks(MOCK_BLOCKS);
      } finally {
        setLoading(false);
      }
    }

    fetchBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return MOCK_STATS[blockId] || [];
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
      console.error(`[GeoWorldLook] Error fetching stats for block ${blockId}:`, err);
      return MOCK_STATS[blockId] || [];
    }
  }

  return {
    blocks,
    loading,
    error,
    getBlockStats
  };
}
