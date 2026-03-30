
import { VineyardBlock, VineyardStat } from "@/types/vineyard";

function generateStats(blockId: string): VineyardStat[] {
  const stats: VineyardStat[] = [];
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);

  for (let i = 0; i < 365; i += 5) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);

    stats.push({
      block_id: blockId,
      date: date.toISOString().split('T')[0],
      cloud_cover: Math.random() * 20,
      ndvi_mean: 0.3 + Math.random() * 0.5,
      ndmi_mean: 0.1 + Math.random() * 0.4
    });
  }
  return stats;
}

export const MOCK_BLOCKS: VineyardBlock[] = [
  {
    id: "block-1",
    name: "Parcela Nord Nebbiolo",
    area_ha: 2.5,
    geom: {
      type: "Polygon",
      coordinates: [[
        [6.0, 46.0],
        [7.0, 46.0],
        [7.0, 47.0],
        [6.0, 47.0],
        [6.0, 46.0]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

export const MOCK_STATS: Record<string, VineyardStat[]> = {
  "block-1": generateStats("block-1")
};
