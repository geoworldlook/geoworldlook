
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateWaterStressCurve(weekIndex: number): number {
  // NDMI: (NIR-SWIR)/(NIR+SWIR)
  // High positive values: high vegetation water content
  // Low/Negative: Water stress
  if (weekIndex <= 20) return 0.1 + Math.random() * 0.2;
  if (weekIndex <= 32) return 0.4 + Math.random() * 0.2; // Peak greenness/water
  if (weekIndex <= 40) return 0.3 - (weekIndex - 32) * 0.05; // Late summer drying
  return 0.0 + Math.random() * 0.1;
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
      ndmi_mean: parseFloat(generateWaterStressCurve(i).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return stats;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "vb-neb-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 4.5,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.0, 46.5],
        [6.01, 46.5],
        [6.01, 46.51],
        [6.0, 46.51],
        [6.0, 46.5]
      ]]
    }
  },
  {
    id: "vb-mer-02",
    name: "Merlot South Slope",
    area_ha: 3.2,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.05, 46.52],
        [6.06, 46.52],
        [6.06, 46.53],
        [6.05, 46.53],
        [6.05, 46.52]
      ]]
    }
  }
];
