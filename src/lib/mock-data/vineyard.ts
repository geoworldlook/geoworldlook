
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriStats(weekIndex: number): Partial<VineyardStat> {
  // Simulates a realistic agricultural phenology curve for NDVI
  let ndvi = 0.2;
  if (weekIndex <= 12) ndvi = 0.2 + Math.random() * 0.05;
  else if (weekIndex <= 21) ndvi = 0.3 + (weekIndex - 12) * 0.04;
  else if (weekIndex <= 30) ndvi = 0.75 + Math.random() * 0.1;
  else if (weekIndex <= 34) ndvi = 0.85 - (weekIndex - 30) * 0.15;
  else ndvi = 0.2 + Math.random() * 0.08;

  // Simulates NDMI (Water Stress) - typically follows NDVI but with different peaks
  let ndmi = ndvi * 0.6 + (Math.random() * 0.2 - 0.1);

  return {
    ndvi_mean: parseFloat(ndvi.toFixed(3)),
    ndmi_mean: parseFloat(ndmi.toFixed(3)),
    cloud_cover: Math.floor(Math.random() * 20)
  };
}

export function generateVineyardStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const generated = generateAgriStats(i);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: generated.ndvi_mean!,
      ndmi_mean: generated.ndmi_mean!,
      cloud_cover: generated.cloud_cover!
    });
  }
  return stats;
}

export const MOCK_VINEYARDS: VineyardBlock[] = [
  {
    id: "vb-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.45,
    geom: {
      type: "Polygon",
      coordinates: [[
        [1.745, 48.245],
        [1.755, 48.245],
        [1.755, 48.255],
        [1.745, 48.255],
        [1.745, 48.245]
      ]]
    }
  },
  {
    id: "vb-02",
    name: "Parcela South Sangiovese",
    area_ha: 3.12,
    geom: {
      type: "Polygon",
      coordinates: [[
        [10.045, 45.145],
        [10.055, 45.145],
        [10.055, 45.155],
        [10.045, 45.155],
        [10.045, 45.145]
      ]]
    }
  },
  {
    id: "vb-03",
    name: "Morges Lakeside Block",
    area_ha: 1.85,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.475, 46.525],
        [6.485, 46.525],
        [6.485, 46.535],
        [6.475, 46.535],
        [6.475, 46.525]
      ]]
    }
  }
];
