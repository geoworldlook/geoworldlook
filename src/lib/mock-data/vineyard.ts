
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateStats(): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date('2024-01-01');

  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    stats.push({
      date: d.toISOString().split('T')[0],
      ndvi_mean: parseFloat((0.2 + Math.random() * 0.6).toFixed(3)),
      ndmi_mean: parseFloat((0.1 + Math.random() * 0.4).toFixed(3)),
      cloud_cover: Math.floor(Math.random() * 15)
    });
  }
  return stats;
}

export const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-01",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.45,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.530, 51.940],
        [15.535, 51.940],
        [15.535, 51.945],
        [15.530, 51.945],
        [15.530, 51.940]
      ]]
    },
    stats: generateStats()
  },
  {
    id: "block-02",
    name: "Chardonnay South",
    area_ha: 1.80,
    geom: {
      type: "Polygon",
      coordinates: [[
        [15.540, 51.935],
        [15.545, 51.935],
        [15.545, 51.938],
        [15.540, 51.938],
        [15.540, 51.935]
      ]]
    },
    stats: generateStats()
  }
];
