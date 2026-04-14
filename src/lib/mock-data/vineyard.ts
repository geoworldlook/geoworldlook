
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateAgriCurve(weekIndex: number, type: 'ndvi' | 'ndmi'): number {
  if (type === 'ndvi') {
    if (weekIndex <= 12) return 0.2 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.3 + (weekIndex - 12) * 0.04;
    if (weekIndex <= 30) return 0.75 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.85 - (weekIndex - 30) * 0.15;
    return 0.2 + Math.random() * 0.08;
  } else {
    // NDMI typically follows NDVI but with different scale and sensitivity to water
    if (weekIndex <= 12) return 0.1 + Math.random() * 0.05;
    if (weekIndex <= 21) return 0.15 + (weekIndex - 12) * 0.03;
    if (weekIndex <= 30) return 0.5 + Math.random() * 0.1;
    if (weekIndex <= 34) return 0.6 - (weekIndex - 30) * 0.1;
    return 0.1 + Math.random() * 0.08;
  }
}

function generateStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 52; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    stats.push({
      block_id: blockId,
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat(generateAgriCurve(i, 'ndvi').toFixed(3)),
      ndmi_mean: parseFloat(generateAgriCurve(i, 'ndmi').toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 20)
    });
  }
  return stats;
}

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: "block-zg-01",
    name: "Parcela Południowa - Riesling",
    area_ha: 2.5,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.500, 51.930],
        [15.505, 51.930],
        [15.505, 51.935],
        [15.500, 51.935],
        [15.500, 51.930]
      ]]
    }
  },
  {
    id: "block-zg-02",
    name: "Wzgórze Winnicze - Pinot Noir",
    area_ha: 1.8,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.510, 51.932],
        [15.518, 51.932],
        [15.518, 51.938],
        [15.510, 51.938],
        [15.510, 51.932]
      ]]
    }
  },
  {
    id: "block-zg-03",
    name: "Dolina Strumienia - Solaris",
    area_ha: 3.2,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.490, 51.925],
        [15.498, 51.925],
        [15.495, 51.920],
        [15.490, 51.920],
        [15.490, 51.925]
      ]]
    }
  }
];

export const MOCK_VINEYARD_STATS: Record<string, VineyardStat[]> = {
  "block-zg-01": generateStats("block-zg-01"),
  "block-zg-02": generateStats("block-zg-02"),
  "block-zg-03": generateStats("block-zg-03"),
};
