import { VineyardBlock, VineyardStat } from '@/types/vineyard';

export const MOCK_VINEYARD_BLOCKS: VineyardBlock[] = [
  {
    id: 'block-1',
    name: 'Parcela Nord Nebbiolo',
    area_ha: 2.5,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [16.2, 51.1],
        [16.21, 51.1],
        [16.21, 51.11],
        [16.2, 51.11],
        [16.2, 51.1]
      ]]
    },
    created_at: new Date().toISOString()
  },
  {
    id: 'block-2',
    name: 'Vigna del Sole',
    area_ha: 1.8,
    geom: {
      type: 'Polygon',
      coordinates: [[
        [16.25, 51.15],
        [16.26, 51.15],
        [16.26, 51.16],
        [16.25, 51.16],
        [16.25, 51.15]
      ]]
    },
    created_at: new Date().toISOString()
  }
];

export const MOCK_VINEYARD_STATS: VineyardStat[] = [
  {
    block_id: 'block-1',
    date: '2024-01-01',
    cloud_cover: 10,
    ndvi_mean: 0.45,
    ndmi_mean: 0.2
  },
  {
    block_id: 'block-1',
    date: '2024-02-01',
    cloud_cover: 5,
    ndvi_mean: 0.5,
    ndmi_mean: 0.25
  },
  {
    block_id: 'block-1',
    date: '2024-03-01',
    cloud_cover: 15,
    ndvi_mean: 0.6,
    ndmi_mean: 0.3
  },
  {
    block_id: 'block-2',
    date: '2024-03-01',
    cloud_cover: 0,
    ndvi_mean: 0.7,
    ndmi_mean: 0.4
  }
];
