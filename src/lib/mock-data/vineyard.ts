
import { VineyardBlockCollection, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateWaterCurve(weekIndex: number): number {
  // NDMI: High in spring, drops during summer heat/drought
  if (weekIndex <= 15) return 0.4 + Math.random() * 0.1;
  if (weekIndex <= 25) return 0.5 - (weekIndex - 15) * 0.02;
  if (weekIndex <= 35) return 0.2 + Math.random() * 0.1;
  return 0.3 + Math.random() * 0.05;
}

export function generateMockStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i).toFixed(3)),
      ndmi_mean: parseFloat(generateWaterCurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return stats;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlockCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'block-01',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.481, 46.531],
          [6.485, 46.531],
          [6.485, 46.535],
          [6.481, 46.535],
          [6.481, 46.531]
        ]]
      },
      properties: {
        id: 'block-01',
        name: 'Parcela Nord Nebbiolo',
        area_ha: 2.45
      }
    },
    {
      type: 'Feature',
      id: 'block-02',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.491, 46.541],
          [6.495, 46.541],
          [6.495, 46.545],
          [6.491, 46.545],
          [6.491, 46.541]
        ]]
      },
      properties: {
        id: 'block-02',
        name: 'Vigne du Lac',
        area_ha: 1.82
      }
    }
  ]
};
