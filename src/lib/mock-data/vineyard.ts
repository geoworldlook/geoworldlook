
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateNDVICurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateNDMICurve(weekIndex: number): number {
  // NDMI ranges from -1 to 1, usually 0.1 to 0.4 for healthy vegetation
  if (weekIndex <= 12) return 0.05 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.1 + (weekIndex - 12) * 0.02;
  if (weekIndex <= 30) return 0.3 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.35 - (weekIndex - 30) * 0.05;
  return 0.1 + Math.random() * 0.05;
}

function generateStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateNDVICurve(i).toFixed(3)),
      ndmi_mean: parseFloat(generateNDMICurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return stats;
}

export const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-pl-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.5,
    geometry: {
      type: "Polygon",
      coordinates: [[[15.5, 51.9], [15.51, 51.9], [15.51, 51.91], [15.5, 51.91], [15.5, 51.9]]]
    }
  },
  {
    id: "block-pl-02",
    name: "Sektor Południowy Riesling",
    area_ha: 3.2,
    geometry: {
      type: "Polygon",
      coordinates: [[[15.52, 51.92], [15.53, 51.92], [15.53, 51.93], [15.52, 51.93], [15.52, 51.92]]]
    }
  }
];

export const MOCK_STATS_MAP: Record<string, VineyardStat[]> = {
  "block-pl-01": generateStats(),
  "block-pl-02": generateStats()
};
