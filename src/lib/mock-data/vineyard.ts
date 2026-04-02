
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number, type: 'NDVI' | 'NDMI'): number {
  if (type === 'NDVI') {
    if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
    if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
    return 0.2 + Math.random() * 0.08;
  } else {
    // NDMI (Moisture) - usually follows NDVI but with different peaks/drops
    if (weekIndex <= 12) return 0.1 + Math.random() * 0.05;
    if (weekIndex <= 25) return 0.2 + (weekIndex - 12) * 0.02;
    if (weekIndex <= 35) return 0.4 + Math.random() * 0.1;
    return 0.15 + Math.random() * 0.05;
  }
}

function generateStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2025-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, 'NDVI').toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, 'NDMI').toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 15)
    });
  }
  return stats;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-ch-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.45,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.480, 46.530],
        [6.485, 46.530],
        [6.485, 46.535],
        [6.480, 46.535],
        [6.480, 46.530]
      ]]
    }
  },
  {
    id: "block-ch-02",
    name: "Parcela Sud Syrah",
    area_ha: 1.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.486, 46.530],
        [6.491, 46.530],
        [6.491, 46.535],
        [6.486, 46.535],
        [6.486, 46.530]
      ]]
    }
  },
  {
    id: "block-fr-01",
    name: "Clos du Val",
    area_ha: 5.20,
    geom: {
      type: "Polygon",
      coordinates: [[
        [1.750, 48.250],
        [1.760, 48.250],
        [1.760, 48.260],
        [1.750, 48.260],
        [1.750, 48.250]
      ]]
    }
  }
];

export const MOCK_VINEYARD_STATS: Record<string, VineyardStat[]> = {
  "block-ch-01": generateStats(),
  "block-ch-02": generateStats(),
  "block-fr-01": generateStats(),
};
