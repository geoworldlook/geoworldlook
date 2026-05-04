
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number): number {
  if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
  if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
  if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
  if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
  return 0.2 + Math.random() * 0.08;
}

function generateTimeSeries(): VineyardStat[] {
  const series: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    const ndvi = generateAgriCurve(i);
    series.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(ndvi.toFixed(3)),
      ndmi_mean: parseFloat((ndvi * 0.8 - 0.1).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return series;
}

export const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-pl-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.5,
    geom: {
        type: "Polygon",
        coordinates: [[[15.50, 51.93], [15.51, 51.93], [15.51, 51.94], [15.50, 51.94], [15.50, 51.93]]]
    },
    created_at: new Date().toISOString()
  }
];

export const MOCK_STATS_MAP: Record<string, VineyardStat[]> = {
    "block-pl-01": generateTimeSeries()
};
