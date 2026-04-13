
import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'North Nebbiolo Parcel',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.500, 51.900],
        [15.505, 51.900],
        [15.505, 51.905],
        [15.500, 51.905],
        [15.500, 51.900]
      ]]
    }
  },
  {
    id: 'block-2',
    name: 'South Sangiovese Slope',
    area_ha: 3.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [15.510, 51.890],
        [15.520, 51.890],
        [15.520, 51.898],
        [15.510, 51.898],
        [15.510, 51.890]
      ]]
    }
  }
];

export const generateMockStats = (blockId: string): VineyardStat[] => {
  const stats: VineyardStat[] = [];
  const now = new Date();

  for (let i = 12; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
    stats.push({
      date: date.toISOString().split('T')[0],
      cloud_cover: Math.random() * 20,
      ndvi_mean: 0.4 + Math.random() * 0.4,
      ndmi_mean: 0.1 + Math.random() * 0.3
    });
  }

  return stats;
};
