'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VineyardBlock, VineyardStats } from '@/types/database.types';

// Mock data generator for local dev / fallback when Supabase is not configured
function generatePhenologyStats(blockId: string): VineyardStats[] {
  const stats: VineyardStats[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);

    // Simulating agricultural seasonality
    const baseNdvi = 0.2 + Math.sin((i / 52) * Math.PI) * 0.65;
    const baseNdmi = 0.1 + Math.sin((i / 52) * Math.PI) * 0.45;

    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(Math.max(0, baseNdvi + (Math.random() * 0.08 - 0.04)).toFixed(3)),
      ndmi_mean: parseFloat(Math.max(0, baseNdmi + (Math.random() * 0.08 - 0.04)).toFixed(3)),
      cloud_cover: parseFloat((Math.random() * 15).toFixed(1))
    });
  }
  return stats;
}

const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-zielona-gora-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.25,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.500, 51.930],
        [15.508, 51.932],
        [15.509, 51.926],
        [15.502, 51.924],
        [15.500, 51.930]
      ]]
    },
    stats: generatePhenologyStats("block-zielona-gora-01")
  },
  {
    id: "block-zielona-gora-02",
    name: "Sektor Pinot Noir",
    area_ha: 2.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.512, 51.928],
        [15.520, 51.929],
        [15.521, 51.922],
        [15.513, 51.921],
        [15.512, 51.928]
      ]]
    },
    stats: generatePhenologyStats("block-zielona-gora-02")
  },
  {
    id: "block-zielona-gora-03",
    name: "Winnica Solarisa South",
    area_ha: 5.10,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.492, 51.922],
        [15.499, 51.923],
        [15.498, 51.916],
        [15.490, 51.915],
        [15.492, 51.922]
      ]]
    },
    stats: generatePhenologyStats("block-zielona-gora-03")
  }
];

export function useVineyardData() {
  const [blocks, setBlocks] = useState<VineyardBlock[]>([]);
  const [geojson, setGeojson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVineyardBlocks() {
      try {
        const supabase = createClient();

        // Try calling RPC function
        const { data, error: rpcError } = await supabase.rpc('get_vineyard_blocks_geojson');

        if (rpcError || !data || !data.features || data.features.length === 0) {
          // Fallback to table select or mock data
          const { data: tableData, error: tableError } = await supabase
            .from('vineyard_blocks')
            .select('id, name, area_ha, created_at');

          if (tableError || !tableData || tableData.length === 0) {
            // Use mock blocks
            setBlocks(MOCK_BLOCKS);
            setGeojson({
              type: "FeatureCollection",
              features: MOCK_BLOCKS.map(b => ({
                type: "Feature",
                id: b.id,
                geometry: b.geom,
                properties: {
                  id: b.id,
                  name: b.name,
                  area_ha: b.area_ha
                }
              }))
            });
          } else {
            const formattedBlocks: VineyardBlock[] = tableData.map((b: any) => ({
              id: b.id,
              name: b.name,
              area_ha: Number(b.area_ha),
              created_at: b.created_at
            }));
            setBlocks(formattedBlocks);
          }
        } else {
          setGeojson(data);
          const formattedBlocks: VineyardBlock[] = data.features.map((f: any) => ({
            id: f.properties.id || f.id,
            name: f.properties.name,
            area_ha: Number(f.properties.area_ha),
            geom: f.geometry
          }));
          setBlocks(formattedBlocks);
        }
      } catch (err: any) {
        console.warn('Using mock vineyard data due to fetch error:', err.message);
        setBlocks(MOCK_BLOCKS);
        setGeojson({
          type: "FeatureCollection",
          features: MOCK_BLOCKS.map(b => ({
            type: "Feature",
            id: b.id,
            geometry: b.geom,
            properties: {
              id: b.id,
              name: b.name,
              area_ha: b.area_ha
            }
          }))
        });
      } finally {
        setLoading(false);
      }
    }

    fetchVineyardBlocks();
  }, []);

  async function getBlockStats(blockId: string): Promise<VineyardStats[]> {
    try {
      // Check if we have preloaded mock stats
      const mockBlock = MOCK_BLOCKS.find(b => b.id === blockId);
      if (mockBlock && mockBlock.stats) {
        return mockBlock.stats;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from('vineyard_stats')
        .select('block_id, date, cloud_cover, ndvi_mean, ndmi_mean')
        .eq('block_id', blockId)
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        return generatePhenologyStats(blockId);
      }

      return data.map((d: any) => ({
        block_id: d.block_id,
        date: d.date,
        cloud_cover: Number(d.cloud_cover),
        ndvi_mean: Number(d.ndvi_mean),
        ndmi_mean: Number(d.ndmi_mean)
      }));
    } catch (err: any) {
      console.warn(`Error fetching stats for block ${blockId}, fallback to mock stats:`, err);
      return generatePhenologyStats(blockId);
    }
  }

  return {
    blocks,
    geojson,
    loading,
    error,
    getBlockStats
  };
}
