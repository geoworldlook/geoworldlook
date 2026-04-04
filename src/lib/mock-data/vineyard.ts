
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateWaterStressCurve(weekIndex: number): number {
  // NDMI: -1 to 1. Usually 0.1 to 0.4 for healthy vegetation.
  // Drops during drought.
  if (weekIndex <= 20) return 0.1 + Math.random() * 0.1;
  if (weekIndex <= 30) return 0.3 + Math.random() * 0.2; // Peak greenness/water
  if (weekIndex <= 34) return 0.2 - (weekIndex - 30) * 0.05; // Drying up
  return 0.05 + Math.random() * 0.1;
}

function generateStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i).toFixed(3)),
      ndmi_mean: parseFloat(generateWaterStressCurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return stats;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-it-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.5,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [10.05, 45.15],
        [10.06, 45.15],
        [10.06, 45.16],
        [10.05, 45.16],
        [10.05, 45.15]
      ]]
    }
  },
  {
    id: "block-fr-01",
    name: "Cote d'Or Grand Cru",
    area_ha: 2.8,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [4.85, 47.15],
        [4.86, 47.15],
        [4.86, 47.16],
        [4.85, 47.16],
        [4.85, 47.15]
      ]]
    }
  }
];

export const MOCK_STATS_MAP: Record<string, VineyardStat[]> = {
  "block-it-01": generateStats(),
  "block-fr-01": generateStats()
};
